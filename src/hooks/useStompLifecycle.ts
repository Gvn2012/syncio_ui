import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { stompService } from '../services/StompService';
import { 
  setConnectionStatus,
  addMessage,
  updateMessageStatus,
  updateMessageContent,
  addConversation,
  removeConversation,
  removeMessage,
  setUserPresence,
  setTyping,
  fetchConversations,
  fetchTotalUnreadCount,
} from '../store/slices/messagingSlice';
import type { RootState, AppDispatch } from '../store';
import type { MessageResponse } from '../features/messages/types';


export const useStompLifecycle = () => {
  const userId = useSelector((s: RootState) => s.user.id);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    console.log('[STOMP Lifecycle] Effect triggered, userId:', userId);
    if (!userId) {
      console.warn('[STOMP Lifecycle] No userId found, skipping connection');
      return;
    }

    stompService.connect(userId).catch(err => {
      console.error('[STOMP] Connection failed:', err);
    });

    const unsubConnection = stompService.onConnectionChange((connected) => {
      dispatch(setConnectionStatus(connected));
      if (connected) {
        dispatch(fetchConversations());
        dispatch(fetchTotalUnreadCount());
      }
    });

    const unsubs: Array<() => void> = [];

    unsubs.push(
      stompService.subscribe(`/user/${userId}/queue/messages`, (msg: MessageResponse) => {
        if (msg.senderId === userId) {
          stompService.removePendingMessage(msg.id);
        }
        dispatch(addMessage(msg));

        if (msg.senderId !== userId) {
          stompService.publish('/app/chat.ack', msg.id);
        }
      })
    );

    unsubs.push(
      stompService.subscribe(`/user/${userId}/queue/status`, (update) => {
        dispatch(updateMessageStatus(update));
      })
    );

    unsubs.push(
      stompService.subscribe(`/user/${userId}/queue/updates`, (update) => {
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
      })
    );

    unsubs.push(
      stompService.subscribe(`/user/${userId}/queue/typing`, (update) => {
        dispatch(setTyping(update));
      })
    );

    unsubs.push(
      stompService.subscribe(`/topic/presence`, (update) => {
        dispatch(setUserPresence(update));
      })
    );

    unsubs.push(
      stompService.subscribe(`/user/${userId}/queue/call`, (signal) => {
        window.dispatchEvent(new CustomEvent('webrtc-signal', { detail: signal }));
      })
    );


    let visibilityTimer: ReturnType<typeof setTimeout>;
    const onVisibilityChange = () => {
      clearTimeout(visibilityTimer);
      if (document.visibilityState === 'visible') {
        visibilityTimer = setTimeout(() => {
          if (!stompService.isConnected || !stompService.isHealthy()) {
            stompService.forceReconnect();
          }
        }, 5000);
      }
    };

    const onOnline = () => {
      setTimeout(() => {
        if (!stompService.isConnected || !stompService.isHealthy()) {
          stompService.forceReconnect();
        }
      }, 3000);
    };


    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);

    return () => {
      clearTimeout(visibilityTimer);
      unsubConnection();
      unsubs.forEach(u => u());
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
      stompService.disconnect();
    };
  }, [userId, dispatch]);
};
