import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';
import type { RootState } from '../../../store';
import { 
  addMessage, 
  updateMessageStatus, 
  updateMessageContent, 
  addConversation,
  setUserPresence,
  fetchConversations,
  fetchTotalUnreadCount,
  setTyping,
  setConnectionStatus,
  removeConversation,
  removeMessage,
  recallMessage as recallMessageThunk,
  deleteMessage as deleteMessageThunk
} from '../../../store/slices/messagingSlice';
import { type MessageResponse, MessageContentType } from '../types';

let globalStompClient: Client | null = null;
let subscribersCount = 0;
const pendingMessages = new Map<string, { conversationId: string; content: string; timestamp: number }>();

export const useMessaging = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.user.id);

  const connect = useCallback(() => {
    if (!userId) return;

    if (globalStompClient) {
      subscribersCount++;
      return;
    }

    const client = new Client({
      brokerURL: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
      connectHeaders: {
        'X-User-Id': userId || '',
      },
      debug: (msg) => console.log('STOMP:', msg),
      reconnectDelay: 5000,
      heartbeatIncoming: 30000,
      heartbeatOutgoing: 30000,
      onConnect: () => {
        console.log('Connected to WebSocket');
        dispatch(setConnectionStatus(true));

        // Retry pending messages on connect
        pendingMessages.forEach((msg, id) => {
          client.publish({
            destination: '/app/chat.send',
            body: JSON.stringify({
              id,
              conversationId: msg.conversationId,
              senderId: userId,
              content: msg.content,
            }),
          });
        });

        client.subscribe(`/user/${userId}/queue/messages`, (message) => {
          const msg: MessageResponse = JSON.parse(message.body);
          
          if (msg.senderId === userId) {
            pendingMessages.delete(msg.id);
          }

          dispatch(addMessage(msg));
          
          if (msg.senderId !== userId) {
            client.publish({
              destination: '/app/chat.ack',
              body: msg.id
            });
          }
        });

        client.subscribe(`/user/${userId}/queue/status`, (message) => {
          const update = JSON.parse(message.body);
          dispatch(updateMessageStatus(update));
        });

        client.subscribe(`/user/${userId}/queue/updates`, (message) => {
          const update = JSON.parse(message.body);
          if (update.type === 'MESSAGE_EDITED' || update.type === 'MESSAGE_RECALLED') {
            dispatch(updateMessageContent(update.message));
          } else if (update.type === 'CONVERSATION_RESTORED' || update.type === 'CONVERSATION_CREATED') {
            dispatch(addConversation(update.conversation));
          } else if (update.type === 'CONVERSATION_DELETED') {
            dispatch(removeConversation(update.conversationId));
          } else if (update.type === 'MESSAGE_DELETED_LOCAL') {
            dispatch(removeMessage({ 
              conversationId: update.conversationId || '', 
              messageId: update.messageId 
            }));
          }
        });

        client.subscribe(`/user/${userId}/queue/typing`, (message) => {
          const update = JSON.parse(message.body);
          dispatch(setTyping(update));
        });

        client.subscribe(`/topic/presence`, (message) => {
          const update = JSON.parse(message.body);
          dispatch(setUserPresence(update));
        });

        dispatch(fetchConversations() as any);
        dispatch(fetchTotalUnreadCount() as any);
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message']);
      },
      onWebSocketClose: () => {
        console.log('WebSocket closed, attempting to reconnect...');
        dispatch(setConnectionStatus(false));
      }
    });

    client.activate();
    globalStompClient = client;
    subscribersCount = 1;
  }, [userId, dispatch]);

  const disconnect = useCallback(() => {
    if (subscribersCount > 0) {
      subscribersCount--;
      if (subscribersCount === 0 && globalStompClient) {
        globalStompClient.deactivate();
        globalStompClient = null;
        dispatch(setConnectionStatus(false));
      }
    }
  }, []);

  useEffect(() => {
    connect();
    
    const retryInterval = setInterval(() => {
      if (globalStompClient && globalStompClient.connected && pendingMessages.size > 0) {
        const now = Date.now();
        pendingMessages.forEach((msg, id) => {
          if (now - msg.timestamp > 5000) {
            console.log(`Retrying message ${id}...`);
            globalStompClient?.publish({
              destination: '/app/chat.send',
              body: JSON.stringify({
                id,
                conversationId: msg.conversationId,
                senderId: userId,
                content: msg.content,
              }),
            });
            msg.timestamp = now;
          }
        });
      }
    }, 5000);

    return () => {
      clearInterval(retryInterval);
      disconnect();
    };
  }, [connect, disconnect, userId]);

  const sendMessage = (conversationId: string, content: string) => {
    const messageId = crypto.randomUUID();
    
    const optimisticMsg: MessageResponse = {
      id: messageId,
      conversationId,
      senderId: userId || '',
      content,
      type: MessageContentType.TEXT,
      timestamp: new Date().toISOString(),
      status: {},
      isEdited: false,
      isRecalled: false,
      isOptimistic: true
    };
    
    dispatch(addMessage(optimisticMsg));

    pendingMessages.set(messageId, { conversationId, content, timestamp: Date.now() });

    if (globalStompClient && globalStompClient.connected) {
      globalStompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          id: messageId,
          conversationId,
          senderId: userId,
          content,
        }),
      });
    }
  };

  const markAsSeen = useCallback((conversationId: string) => {
    if (globalStompClient && globalStompClient.connected) {
      globalStompClient.publish({
        destination: '/app/chat.read',
        body: conversationId,
      });
    }
  }, []);

  const editMessage = useCallback((messageId: string, content: string) => {
    if (globalStompClient && globalStompClient.connected) {
      globalStompClient.publish({
        destination: '/app/chat.edit',
        body: JSON.stringify({
          id: messageId,
          content
        }),
      });
    }
  }, []);

  const deleteMessage = useCallback((conversationId: string, messageId: string) => {
    dispatch(deleteMessageThunk({ conversationId, messageId }) as any);
  }, [dispatch]);

  const recallMessage = useCallback((messageId: string) => {
    dispatch(recallMessageThunk(messageId) as any);
  }, [dispatch]);

  const deleteConversation = useCallback((conversationId: string) => {
    if (globalStompClient && globalStompClient.connected) {
      globalStompClient.publish({
        destination: '/app/conversation.delete',
        body: conversationId,
      });
    }
  }, []);

  const sendTyping = useCallback((conversationId: string, recipientId: string, isTyping: boolean) => {
    if (globalStompClient && globalStompClient.connected) {
      globalStompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({
          conversationId,
          recipientId,
          isTyping: isTyping.toString()
        }),
      });
    }
  }, []);

  return { sendMessage, markAsSeen, editMessage, deleteMessage, recallMessage, deleteConversation, sendTyping };
};
