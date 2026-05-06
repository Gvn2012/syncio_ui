import { Client, type IFrame, type IMessage } from '@stomp/stompjs';

type ConnectionListener = (connected: boolean) => void;
type MessageHandler = (body: unknown) => void;

interface QueuedMessage {
  destination: string;
  body: string;
}

const EPHEMERAL_DESTINATIONS = ['typing', 'presence'] as const;

const isEphemeral = (destination: string): boolean =>
  EPHEMERAL_DESTINATIONS.some((keyword) => destination.includes(keyword));

const createKeepaliveWorker = (): Worker | null => {
  try {
    const code = `
      let interval = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (interval) clearInterval(interval);
          interval = setInterval(function() { self.postMessage('tick'); }, 10000);
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
};

class StompService {
  private client: Client | null = null;
  private userId: string | null = null;
  private deactivatingPromise: Promise<void> | null = null;

  private handlers = new Map<string, Set<MessageHandler>>();
  private messageQueue: QueuedMessage[] = [];
  private pendingMessages = new Map<string, { conversationId: string; content: string; timestamp: number }>();
  private retryInterval: ReturnType<typeof setInterval> | null = null;
  private connectionListeners = new Set<ConnectionListener>();
  private _connected = false;

  private keepaliveWorker: Worker | null = null;
  private lastActivityTime = 0;
  private hardReconnectCount = 0;
  private reconnectInProgress = false;
  private activeSubscriptions = new Set<string>();

  private presenceInterval: ReturnType<typeof setInterval> | null = null;

  get isConnected(): boolean {
    return this._connected;
  }

  get currentUserId(): string | null {
    return this.userId;
  }

  async connect(userId: string): Promise<void> {
    console.log(`[STOMP] connect called, userId: ${userId}`);
    if (this.userId === userId && (this.client?.active || this._connected)) {
      console.log('[STOMP] Already connected or active, skipping.');
      return;
    }

    if (this.deactivatingPromise) {
      console.log('[STOMP] Waiting for previous deactivation...');
      await this.deactivatingPromise;
    }

    console.log('[STOMP] Tearing down previous client if any...');
    await this.teardown();

    this.userId = userId;

    console.log('[STOMP] Initializing new client...');
    await this.initializeClient(userId);
  }

  private async initializeClient(userId: string): Promise<void> {
    if (this.client) return;

    const brokerUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`;
    console.log(`[STOMP] Creating client, brokerURL: ${brokerUrl}`);

    this.client = new Client({
      brokerURL: brokerUrl,
      connectHeaders: { 'X-User-Id': userId },
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      reconnectDelay: 3000,
      debug: (msg) => {
        // Track both incoming and outgoing frames for health checks
        if (msg.includes('<<<') || msg.includes('>>>')) {
          this.lastActivityTime = Date.now();
        }
      },
      onConnect: () => {
        console.log('[STOMP] onConnect triggered');
        this.onConnected();
      },
      onStompError: (frame) => {
        console.error('[STOMP] onStompError:', frame);
        this.onError(frame);
      },
      onWebSocketClose: (evt) => {
        console.log('[STOMP] onWebSocketClose:', evt);
        this.onDisconnected(evt);
      },
      onWebSocketError: (err) => {
        console.error('[STOMP] WebSocket Error:', err);
      },
    });

    this.lastActivityTime = Date.now();
    this.client.activate();
    this.startPendingMessageRetry();
    this.startKeepalive();
  }

  async disconnect(): Promise<void> {
    await this.teardown();
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

  publish(destination: string, body: unknown): void {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);

    if (this.client?.connected) {
      console.log(`[STOMP] → ${destination}`);
      this.client.publish({ destination, body: payload });
      this.lastActivityTime = Date.now();
    } else {
      // Drop time-sensitive events — they're stale by the time connection returns
      if (isEphemeral(destination)) {
        console.warn(`[STOMP] Dropped ephemeral event (disconnected): ${destination}`);
        return;
      }
      console.warn(`[STOMP] Queued (disconnected): ${destination}`);
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
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  isHealthy(): boolean {
    if (!this._connected) return false;
    // 3 minute threshold — tolerates browser throttling of background tabs
    return (Date.now() - this.lastActivityTime) < 180_000;
  }

  forceReconnect(): void {
    if (!this.userId || this.reconnectInProgress) return;

    this.reconnectInProgress = true;
    this.hardReconnectCount++;
    const uid = this.userId;
    console.log(`[STOMP] Force reconnecting (attempt #${this.hardReconnectCount})...`);

    this.stopKeepalive();
    this.stopPresenceHeartbeat();
    this.setConnected(false);

    const oldClient = this.client;
    this.client = null;
    this.activeSubscriptions.clear();

    const doReconnect = () => {
      this.reconnectInProgress = false;
      if (this.userId === uid) {
        this.initializeClient(uid);
      }
    };

    if (oldClient) {
      try {
        oldClient.forceDisconnect();
      } catch {
        /* noop */
      }
      oldClient.deactivate().then(doReconnect).catch(doReconnect);
    } else {
      doReconnect();
    }
  }

  // ---------------------------------------------------------------------------
  // Keepalive Worker
  // ---------------------------------------------------------------------------

  private startKeepalive(): void {
    this.stopKeepalive();

    this.keepaliveWorker = createKeepaliveWorker();
    if (!this.keepaliveWorker) return;

    this.lastActivityTime = Date.now();

    this.keepaliveWorker.onmessage = () => {
      if (!this.userId) return;

      const now = Date.now();
      const sinceLast = now - this.lastActivityTime;

      if (this.client?.connected && this._connected) {
        if (sinceLast > 180_000) {
          console.warn(`[STOMP] Watchdog: No activity for ${Math.round(sinceLast / 1000)}s, forcing reconnect`);
          this.forceReconnect();
        }
      } else if (!this.client?.active) {
        if (this.hardReconnectCount < 10) {
          console.log('[STOMP] Keepalive: Client is dead, forcing reconnect');
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

  // ---------------------------------------------------------------------------
  // Presence Heartbeat
  // ---------------------------------------------------------------------------

  private startPresenceHeartbeat(): void {
    this.stopPresenceHeartbeat();

    // Announce online immediately upon connect
    this.publishPresence('ONLINE');

    // Re-announce every 60s to keep server-side presence alive
    this.presenceInterval = setInterval(() => {
      if (this.client?.connected) {
        this.publishPresence('ONLINE');
      }
    }, 60_000);
  }

  private stopPresenceHeartbeat(): void {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
  }

  private publishPresence(status: 'ONLINE' | 'OFFLINE'): void {
    if (!this.client?.connected || !this.userId) return;
    this.client.publish({
      destination: '/app/presence.update',
      body: JSON.stringify({ userId: this.userId, status }),
    });
    console.log(`[STOMP] → Presence: ${status}`);
  }

  // ---------------------------------------------------------------------------
  // Connection lifecycle
  // ---------------------------------------------------------------------------

  private onConnected(): void {
    this.hardReconnectCount = 0;
    this.reconnectInProgress = false;
    this.lastActivityTime = Date.now();
    this.setConnected(true);
    this.subscribeAll();

    // Delay queue flush to let subscriptions settle before publishing
    setTimeout(() => this.flushMessageQueue(), 500);
    this.retryPendingMessages();
    this.startPresenceHeartbeat();
  }

  private onDisconnected(evt?: CloseEvent): void {
    if (evt) {
      console.log(`[STOMP] WebSocket closed (code: ${evt.code}, reason: ${evt.reason})`);
    }
    this.setConnected(false);
    this.activeSubscriptions.clear();
    this.stopPresenceHeartbeat();
  }

  private onError(frame: IFrame): void {
    console.error('[STOMP Error]', frame.headers['message'], frame.body);
  }

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------

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
        const body = JSON.parse(message.body) as unknown;
        this.handlers.get(destination)?.forEach((h) => h(body));
      } catch {
        this.handlers.get(destination)?.forEach((h) => h(message.body));
      }
    });
    this.activeSubscriptions.add(destination);
  }

  // ---------------------------------------------------------------------------
  // Message queue & retry
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private setConnected(connected: boolean): void {
    if (this._connected === connected) return;
    this._connected = connected;
    this.connectionListeners.forEach((l) => l(connected));
  }

  private async teardown(): Promise<void> {
    this.stopPendingMessageRetry();
    this.stopKeepalive();
    this.stopPresenceHeartbeat();

    // Try to announce offline before disconnecting
    this.publishPresence('OFFLINE');

    this.activeSubscriptions.clear();

    if (this.client) {
      const oldClient = this.client;
      this.client = null;
      this.deactivatingPromise = oldClient
        .deactivate()
        .then(() => {
          this.deactivatingPromise = null;
        })
        .catch(() => {
          this.deactivatingPromise = null;
        });
      await this.deactivatingPromise;
    }

    this.userId = null;
    this.reconnectInProgress = false;
    this.setConnected(false);
  }
}

export const stompService = new StompService();
