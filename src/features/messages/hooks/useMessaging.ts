import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';
import type { RootState } from '../../../store';
import { 
  addMessage, 
  updateMessageStatus, 
  updateMessageContent, 
  addConversation,
  setUserPresence
} from '../../../store/slices/messagingSlice';
import type { MessageResponse } from '../types';

export const useMessaging = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.user.id);
  const stompClientRef = useRef<Client | null>(null);
  const connect = useCallback(() => {
    if (!userId) return;

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

        client.subscribe(`/topic/presence`, (message) => {
          const update = JSON.parse(message.body);
          dispatch(setUserPresence(update));
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message']);
      },
      onWebSocketClose: () => {
        console.log('WebSocket closed, attempting to reconnect...');
      }
    });

    client.activate();
    stompClientRef.current = client;
  }, [userId, dispatch]);

  const disconnect = useCallback(() => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const sendMessage = (conversationId: string, content: string) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          conversationId,
          senderId: userId,
          content,
        }),
      });
    }
  };

  const markAsSeen = useCallback((conversationId: string) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat.read',
        body: conversationId,
      });
    }
  }, []);

  const editMessage = useCallback((messageId: string, content: string) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat.edit',
        body: JSON.stringify({
          id: messageId,
          content
        }),
      });
    }
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat.delete',
        body: messageId,
      });
    }
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/conversation.delete',
        body: conversationId,
      });
    }
  }, []);

  return { sendMessage, markAsSeen, editMessage, deleteMessage, deleteConversation };
};
