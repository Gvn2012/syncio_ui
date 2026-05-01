import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { stompService } from '../../../services/StompService';
import type { RootState } from '../../../store';
import { 
  addMessage,
  recallMessage as recallMessageThunk,
  deleteMessage as deleteMessageThunk
} from '../../../store/slices/messagingSlice';
import { type MessageResponse, MessageContentType } from '../types';


export const useMessaging = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.user.id);

  const sendMessage = useCallback((conversationId: string, content: string) => {
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

    stompService.addPendingMessage(messageId, conversationId, content);


    stompService.publish('/app/chat.send', {
      id: messageId,
      conversationId,
      senderId: userId,
      content,
    });
  }, [userId, dispatch]);

  const sendSystemMessage = useCallback((conversationId: string, content: string) => {
    const messageId = crypto.randomUUID();
    stompService.publish('/app/chat.send', {
      id: messageId,
      conversationId,
      senderId: userId,
      content,
      type: MessageContentType.SYSTEM
    });
  }, [userId]);

  const markAsSeen = useCallback((conversationId: string) => {
    stompService.publish('/app/chat.read', conversationId);
  }, []);

  const editMessage = useCallback((messageId: string, content: string) => {
    stompService.publish('/app/chat.edit', { id: messageId, content });
  }, []);

  const deleteMessage = useCallback((conversationId: string, messageId: string) => {
    dispatch(deleteMessageThunk({ conversationId, messageId }) as any);
  }, [dispatch]);

  const recallMessage = useCallback((messageId: string) => {
    dispatch(recallMessageThunk(messageId) as any);
  }, [dispatch]);

  const deleteConversation = useCallback((conversationId: string) => {
    stompService.publish('/app/conversation.delete', conversationId);
  }, []);

  const sendTyping = useCallback((conversationId: string, recipientId: string, isTyping: boolean) => {
    stompService.publish('/app/chat.typing', {
      conversationId,
      recipientId,
      isTyping: isTyping.toString()
    });
  }, []);

  const sendSignal = useCallback((signal: any) => {
    stompService.publish('/app/call.signal', signal);
  }, []);

  const createGroup = useCallback((name: string, participantIds: string[]) => {
    stompService.publish('/app/group.create', { name, participantIds });
  }, []);

  const updateGroup = useCallback((conversationId: string, updates: { name?: string, description?: string, groupAvatar?: string }) => {
    stompService.publish('/app/group.update', { conversationId, ...updates });
  }, []);

  const leaveGroup = useCallback((conversationId: string) => {
    stompService.publish('/app/group.leave', { conversationId });
  }, []);

  const manageGroupMembers = useCallback((conversationId: string, userId: string, action: 'ADD' | 'REMOVE' | 'PROMOTE' | 'DEMOTE') => {
    stompService.publish('/app/group.members', { conversationId, userId, action });
  }, []);

  return { sendMessage, sendSystemMessage, markAsSeen, editMessage, deleteMessage, recallMessage, deleteConversation, sendTyping, sendSignal, createGroup, updateGroup, leaveGroup, manageGroupMembers };
};
