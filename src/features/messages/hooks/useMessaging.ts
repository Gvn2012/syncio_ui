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
  setTyping
} from '../../../store/slices/messagingSlice';
import type { MessageResponse } from '../types';

let globalStompClient: Client | null = null;
let subscribersCount = 0;

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
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('Connected to WebSocket');

        client.subscribe(`/user/${userId}/queue/messages`, (message) => {
          const msg: MessageResponse = JSON.parse(message.body);
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
          } else if (update.type === 'MESSAGE_DELETED_LOCAL') {
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

        // Hydrate conversation states & missed messages on reconnect
        dispatch(fetchConversations() as any);
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message']);
      },
      onWebSocketClose: () => {
        console.log('WebSocket closed, attempting to reconnect...');
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
      }
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const sendMessage = (conversationId: string, content: string) => {
    if (globalStompClient && globalStompClient.connected) {
      const messageId = crypto.randomUUID();
      
      const optimisticMsg: MessageResponse = {
        id: messageId,
        conversationId,
        senderId: userId || '',
        content,
        timestamp: new Date().toISOString(),
        status: {},
        isEdited: false,
        isDeleted: false,
        isOptimistic: true
      };
      
      dispatch(addMessage(optimisticMsg));

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

  const deleteMessage = useCallback((messageId: string) => {
    if (globalStompClient && globalStompClient.connected) {
      globalStompClient.publish({
        destination: '/app/chat.delete',
        body: messageId,
      });
    }
  }, []);

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

  return { sendMessage, markAsSeen, editMessage, deleteMessage, deleteConversation, sendTyping };
};
