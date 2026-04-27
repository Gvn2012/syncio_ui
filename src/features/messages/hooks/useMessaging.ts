import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { RootState } from '../../../store';
import { 
  addMessage, 
  updateMessageStatus, 
  updateMessageContent, 
  addConversation
} from '../../../store/slices/messagingSlice';
import type { MessageResponse } from '../types';

export const useMessaging = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.user.id);
  const stompClientRef = useRef<Client | null>(null);

  const connect = useCallback(() => {
    if (!userId) return;

    const socket = new SockJS('/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (msg) => console.log('STOMP:', msg),
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
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message']);
      },
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

  const markAsSeen = (conversationId: string) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat.seen',
        body: JSON.stringify({
          conversationId,
          userId,
        }),
      });
    }
  };

  return { sendMessage, markAsSeen };
};
