import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { Conversation, MessageResponse } from '../types';
import type { 
  GetMessagesRequest, 
  CreateConversationRequest
} from './types';

export const MessagesService = {
  /**
   * Fetch conversations for the current user.
   */
  getConversations: async (): Promise<APIResource<Conversation[]>> => {
    const response = await api.get<APIResource<Conversation[]>>('messaging/conversations');
    return response.data;
  },

  /**
   * Fetch messages for a specific conversation.
   */
  getMessages: async (params: GetMessagesRequest): Promise<APIResource<MessageResponse[]>> => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.append('page', params.page.toString());
    if (params.size !== undefined) query.append('size', params.size.toString());

    const response = await api.get<APIResource<MessageResponse[]>>(`messaging/conversations/${params.conversationId}/messages?${query.toString()}`);
    return response.data;
  },

  /**
   * Create a new conversation.
   */
  createConversation: async (data: CreateConversationRequest): Promise<APIResource<Conversation>> => {
    const response = await api.post<APIResource<Conversation>>('messaging/conversations', data);
    return response.data;
  }
};
