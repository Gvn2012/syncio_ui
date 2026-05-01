import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { Conversation, MessageResponse } from '../types';
import type { 
  GetMessagesRequest, 
  CreateConversationRequest
} from './types';

export const MessagesService = {

  getConversations: async (): Promise<APIResource<Conversation[]>> => {
    const response = await api.get<APIResource<Conversation[]>>('messaging/conversations');
    return response.data;
  },


  getMessages: async (params: GetMessagesRequest): Promise<APIResource<MessageResponse[]>> => {
    const query = new URLSearchParams();
    if (params.before !== undefined) query.append('before', params.before);
    if (params.size !== undefined) query.append('size', params.size.toString());

    const response = await api.get<APIResource<MessageResponse[]>>(`messaging/conversations/${params.conversationId}/messages?${query.toString()}`);
    return response.data;
  },


  createConversation: async (data: CreateConversationRequest): Promise<APIResource<Conversation>> => {
    const response = await api.post<APIResource<Conversation>>('messaging/conversations', data);
    return response.data;
  },

  recallMessage: async (messageId: string): Promise<APIResource<void>> => {
    const response = await api.delete<APIResource<void>>(`messaging/messages/${messageId}/recall`);
    return response.data;
  },

  deleteMessage: async (messageId: string): Promise<APIResource<void>> => {
    const response = await api.delete<APIResource<void>>(`messaging/messages/${messageId}`);
    return response.data;
  },

  getTotalUnreadCount: async (): Promise<APIResource<number>> => {
    const response = await api.get<APIResource<number>>('messaging/unread-count');
    return response.data;
  },

  getGroupSummary: async (conversationId: string): Promise<APIResource<any>> => {
    const response = await api.get<APIResource<any>>(`messaging/conversations/${conversationId}/summary`);
    return response.data;
  }
};
