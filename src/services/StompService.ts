import { Client, type IFrame, type IMessage } from '@stomp/stompjs';

type ConnectionListener = (connected: boolean) => void;
type MessageHandler = (body: any) => void;

interface QueuedMessage {
  destination: string;
  body: string;
}

function createKeepaliveWorker(): Worker | null {
  try {
    const code = `
      let interval = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (interval) clearInterval(interval);
          interval = setInterval(function() { self.postMessage('tick'); }, 15000);
        } else if (e.data === 'stop') {
          if (interval) clearInterval(interval);
          interval = null;
        }
      };
    `;
    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    return worker;
  } catch {
    console.warn('[STOMP] Web Worker not available, background keepalive disabled');
    return null;
  }
}

class StompService {
  private client: Client | null = null;
  private userId: string | null = null;

  private isReconnecting = false;

  private handlers = new Map<string, Set<MessageHandler>>();
  private messageQueue: QueuedMessage[] = [];
  private pendingMessages = new Map<string, { conversationId: string; content: string; timestamp: number }>();
  private retryInterval: ReturnType<typeof setInterval> | null = null;
  private connectionListeners = new Set<ConnectionListener>();
  private _connected = false;

  private keepaliveWorker: Worker | null = null;
  private webLock: AbortController | null = null;
  private lastPongTime = 0;

  get isConnected(): boolean {
    return this._connected;
  }

  get currentUserId(): string | null {
    return this.userId;
  }

  connect(userId: string): void {
    if (this.client?.active && this.userId === userId) return;

    this.teardown();

    this.userId = userId;
    this.isReconnecting = false;

    this.client = new Client({
      brokerURL: `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`,
      connectHeaders: { 'X-User-Id': userId },
      heartbeatIncoming: 25_000,
      heartbeatOutgoing: 25_000,
      reconnectDelay: 5000,
      debug: (msg) => {
        if (import.meta.env.DEV) {
          if (!msg.includes('>>> PING') && !msg.includes('<<< PONG')) {
            console.debug('[STOMP]', msg);
          }
        }
      },
      onConnect: () => this.onConnected(),
      onStompError: (frame) => this.onError(frame),
      onWebSocketClose: () => this.onDisconnected(),

    });

    this.client.activate();
    this.startPendingMessageRetry();
    this.startKeepalive();
    this.acquireWebLock();
  }

  disconnect(): void {
    this.teardown();
  }

  subscribe(destination: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(destination)) {
      this.handlers.set(destination, new Set());
    }
    this.handlers.get(destination)!.add(handler);

    if (this.client?.connected) {
      this.ensureBrokerSubscription(destination);
    }

    return () => {
      this.handlers.get(destination)?.delete(handler);
      if (this.handlers.get(destination)?.size === 0) {
        this.handlers.delete(destination);
      }
    };
  }

  publish(destination: string, body: any): void {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);

    if (this.client?.connected) {
      this.client.publish({ destination, body: payload });
    } else {
      this.messageQueue.push({ destination, body: payload });
    }
  }

  addPendingMessage(id: string, conversationId: string, content: string): void {
    this.pendingMessages.set(id, { conversationId, content, timestamp: Date.now() });
  }

  removePendingMessage(id: string): void {
    this.pendingMessages.delete(id);
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    listener(this._connected);
    return () => { this.connectionListeners.delete(listener); };
  }

  forceReconnect(): void {
    if (!this.userId) return;
    if (this.client?.connected) return;

    console.log('[STOMP] Force reconnect requested');

    if (this.client) {
      this.client.deactivate().then(() => {
        this.client?.activate();
      });
    }
  }

  private startKeepalive(): void {
    this.stopKeepalive();

    this.keepaliveWorker = createKeepaliveWorker();
    if (!this.keepaliveWorker) return;

    this.lastPongTime = Date.now();

    this.keepaliveWorker.onmessage = () => {
      if (!this.userId) return;

      if (this.client?.connected) {
        this.lastPongTime = Date.now();
      } else {
        const elapsed = Date.now() - this.lastPongTime;
        if (elapsed > 30_000 && !this.isReconnecting) {
          console.log('[STOMP] Keepalive: connection lost while backgrounded, forcing reconnect');
          this.isReconnecting = true;
          this.forceReconnect();
        }
      }
    };

    this.keepaliveWorker.postMessage('start');
  }

  private stopKeepalive(): void {
    if (this.keepaliveWorker) {
      this.keepaliveWorker.postMessage('stop');
      this.keepaliveWorker.terminate();
      this.keepaliveWorker = null;
    }
  }

  private acquireWebLock(): void {
    this.releaseWebLock();
    if (!navigator.locks) return;

    this.webLock = new AbortController();

    navigator.locks.request(
      'syncio-ws-keepalive',
      { signal: this.webLock.signal },
      () => new Promise<void>((resolve) => {
        this.webLock?.signal.addEventListener('abort', () => resolve());
      })
    ).catch(() => {});
  }

  private releaseWebLock(): void {
    if (this.webLock) {
      this.webLock.abort();
      this.webLock = null;
    }
  }

  private onConnected(): void {
    this.isReconnecting = false;
    this.lastPongTime = Date.now();
    this.setConnected(true);
    this.subscribeAll();
    this.flushMessageQueue();
    this.retryPendingMessages();
  }

  private onDisconnected(): void {
    // Only process once per disconnect event
    if (!this._connected) return;
    this.setConnected(false);
  }

  private onError(frame: IFrame): void {
    console.error('[STOMP Error]', frame.headers['message'], frame.body);
  }

  private activeSubscriptions = new Set<string>();

  private subscribeAll(): void {
    this.activeSubscriptions.clear();
    for (const destination of this.handlers.keys()) {
      this.ensureBrokerSubscription(destination);
    }
  }

  private ensureBrokerSubscription(destination: string): void {
    if (!this.client?.connected) return;
    if (this.activeSubscriptions.has(destination)) return;

    this.client.subscribe(destination, (message: IMessage) => {
      try {
        const body = JSON.parse(message.body);
        this.handlers.get(destination)?.forEach(h => h(body));
      } catch {
        this.handlers.get(destination)?.forEach(h => h(message.body));
      }
    });
    this.activeSubscriptions.add(destination);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const item = this.messageQueue.shift()!;
      if (this.client?.connected) {
        this.client.publish(item);
      }
    }
  }

  private retryPendingMessages(): void {
    if (!this.client?.connected || !this.userId) return;
    this.pendingMessages.forEach((msg, id) => {
      this.client!.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          id,
          conversationId: msg.conversationId,
          senderId: this.userId,
          content: msg.content,
        }),
      });
    });
  }

  private startPendingMessageRetry(): void {
    this.stopPendingMessageRetry();
    this.retryInterval = setInterval(() => {
      if (!this.client?.connected || this.pendingMessages.size === 0) return;
      const now = Date.now();
      this.pendingMessages.forEach((msg, id) => {
        if (now - msg.timestamp > 5000) {
          console.log(`[STOMP] Retrying message ${id}`);
          this.client?.publish({
            destination: '/app/chat.send',
            body: JSON.stringify({
              id,
              conversationId: msg.conversationId,
              senderId: this.userId,
              content: msg.content,
            }),
          });
          msg.timestamp = now;
        }
      });
    }, 5000);
  }

  private stopPendingMessageRetry(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  private setConnected(connected: boolean): void {
    if (this._connected === connected) return;
    this._connected = connected;
    this.connectionListeners.forEach(l => l(connected));
  }

  private teardown(): void {
    this.stopPendingMessageRetry();
    this.stopKeepalive();
    this.releaseWebLock();
    this.activeSubscriptions.clear();

    if (this.client) {
      try { this.client.deactivate(); } catch { /* ignore */ }
      this.client = null;
    }

    this.userId = null;
    this.isReconnecting = false;
    this.setConnected(false);
  }
}

export const stompService = new StompService();
