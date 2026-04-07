import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { 
  GetMessagesRequest, 
  GetMessagesResponse, 
  SendMessageRequest,
  SendMessageResponse 
} from './types';

export const MessagesService = {
  /**
   * Fetch messages for a specific chat.
   * URI: GET http://syncio.site/api/v1/messages
   */
  getMessages: async (params: GetMessagesRequest): Promise<APIResource<GetMessagesResponse>> => {
    const query = new URLSearchParams();
    query.append('chatId', params.chatId);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const response = await api.get<APIResource<GetMessagesResponse>>(`messages?${query.toString()}`);
    return response.data;
  },

  /**
   * Send a new message.
   * URI: POST http://syncio.site/api/v1/messages
   */
  sendMessage: async (data: SendMessageRequest): Promise<APIResource<SendMessageResponse>> => {
    const response = await api.post<APIResource<SendMessageResponse>>('messages', data);
    return response.data;
  }
};
