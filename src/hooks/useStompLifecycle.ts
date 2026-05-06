import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  resetPresence,
  fetchConversations,
  fetchTotalUnreadCount,
} from '../store/slices/messagingSlice';
import type { RootState, AppDispatch } from '../store';
import type { MessageResponse, Conversation } from '../features/messages/types';


export const useStompLifecycle = () => {
  const userId = useSelector((s: RootState) => s.user.id);
  const activeConversationId = useSelector((s: RootState) => s.messaging.activeConversationId);
  const activeConversationIdRef = useRef(activeConversationId);
  const onOnlineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

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
        dispatch(resetPresence());
        dispatch(fetchConversations());
        dispatch(fetchTotalUnreadCount());
      }
    });

    const unsubs: Array<() => void> = [];

    unsubs.push(
      stompService.subscribe(`/user/${userId}/queue/messages`, (raw) => {
        const msg = raw as MessageResponse;
        if (msg.senderId === userId) {
          stompService.removePendingMessage(msg.id);
        }
        dispatch(addMessage(msg));

        if (msg.senderId !== userId) {
          stompService.publish('/app/chat.ack', msg.id);
        }
      })
    );

    interface StatusUpdate {
      messageIds?: string[];
      messageId?: string;
      conversationId: string;
      userId: string;
      status: string;
    }
    unsubs.push(
      stompService.subscribe(`/user/${userId}/queue/status`, (raw) => {
        const update = raw as StatusUpdate;
        dispatch(updateMessageStatus(update));
      })
    );

    // --- Updates subscription (edits, recalls, conversations, groups) ---
    interface ConversationUpdate {
      type: string;
      message?: MessageResponse;
      conversation?: Conversation & { participants: string[] };
      conversationId?: string;
      messageId?: string;
    }
    unsubs.push(
      stompService.subscribe(`/user/${userId}/queue/updates`, (raw) => {
        const update = raw as ConversationUpdate;
        console.log('[STOMP] Received update:', update);
        if (update.type === 'MESSAGE_EDITED' || update.type === 'MESSAGE_RECALLED') {
          if (update.message) dispatch(updateMessageContent(update.message));
        } else if (update.type === 'CONVERSATION_RESTORED' || update.type === 'CONVERSATION_CREATED') {
          if (update.conversation) dispatch(addConversation(update.conversation));
        } else if (update.type === 'GROUP_UPDATED') {
          if (!update.conversation) return;
          console.log('[DEBUG] GROUP_UPDATED received:', update.conversation.id);
          const isStillParticipant = update.conversation.participants.includes(userId);
          console.log('[DEBUG] Membership check:', { 
            userId, 
            participants: update.conversation.participants, 
            isStillParticipant 
          });

          if (isStillParticipant) {
            dispatch(addConversation(update.conversation));
          } else {
            const currentActiveId = activeConversationIdRef.current;
            console.log('[DEBUG] User removed from group, activeConversationId:', currentActiveId);
            dispatch(removeConversation(update.conversation.id));
            if (currentActiveId === update.conversation.id) {
              console.log('[DEBUG] Navigating to /messages');
              navigate('/messages');
            } else {
              console.log('[DEBUG] No navigation needed: activeId mismatch', {
                active: currentActiveId,
                updated: update.conversation.id
              });
            }
          }
        } else if (update.type === 'CONVERSATION_DELETED') {
          console.log('[DEBUG] CONVERSATION_DELETED received:', update.conversationId);
          const currentActiveId = activeConversationIdRef.current;
          if (update.conversationId) dispatch(removeConversation(update.conversationId));
          
          if (currentActiveId === update.conversationId) {
            console.log('[DEBUG] Navigating to /messages due to conversation deletion');
            navigate('/messages');
          }
        } else if (update.type === 'MESSAGE_DELETED_LOCAL') {
          dispatch(removeMessage({ 
            conversationId: update.conversationId || '', 
            messageId: update.messageId || '',
          }));
        }
      })
    );

    // --- Typing subscription ---
    interface TypingUpdate {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }
    unsubs.push(
      stompService.subscribe(`/user/${userId}/queue/typing`, (raw) => {
        const update = raw as TypingUpdate;
        console.log('[STOMP] Typing update:', update);
        dispatch(setTyping(update));
        
        const timerKey = `${update.conversationId}-${update.userId}`;
        if (typingTimersRef.current[timerKey]) {
          clearTimeout(typingTimersRef.current[timerKey]);
          delete typingTimersRef.current[timerKey];
        }

        if (update.isTyping) {
          typingTimersRef.current[timerKey] = setTimeout(() => {
            dispatch(setTyping({ ...update, isTyping: false }));
            delete typingTimersRef.current[timerKey];
          }, 10000); // 10 second safety timeout
        }
      })
    );

    // --- Presence subscription ---
    interface PresenceUpdate {
      userId?: string;
      id?: string;
      status: string;
    }
    unsubs.push(
      stompService.subscribe(`/topic/presence`, (raw) => {
        const update = raw as PresenceUpdate;
        console.log('[STOMP] Presence update:', update);
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
        }, 1000);
      }
    };

    const onOnline = () => {
      onOnlineTimeoutRef.current = setTimeout(() => {
        if (!stompService.isConnected || !stompService.isHealthy()) {
          stompService.forceReconnect();
        }
      }, 3000);
    };


    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);

    return () => {
      clearTimeout(visibilityTimer);
      if (onOnlineTimeoutRef.current) clearTimeout(onOnlineTimeoutRef.current);
      unsubConnection();
      unsubs.forEach(u => u());
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
      Object.values(typingTimersRef.current).forEach(clearTimeout);
      typingTimersRef.current = {};
      stompService.disconnect();
    };
  }, [userId, dispatch, navigate]);
};
