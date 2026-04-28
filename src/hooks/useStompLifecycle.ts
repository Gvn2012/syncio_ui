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
    if (!userId) return;

    stompService.connect(userId);

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


    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !stompService.isConnected) {
        stompService.forceReconnect();
      }
    };

    const onOnline = () => {
      if (!stompService.isConnected) {
        stompService.forceReconnect();
      }
    };

    const onOffline = () => {
      dispatch(setConnectionStatus(false));
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      unsubConnection();
      unsubs.forEach(u => u());
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      stompService.disconnect();
    };
  }, [userId, dispatch]);
};
