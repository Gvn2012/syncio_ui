import type { MessageResponse } from '../types';

export interface GetMessagesRequest {
  conversationId: string;
  page?: number;
  size?: number;
}

export interface GetMessagesResponse extends Array<MessageResponse> {}

export interface CreateConversationRequest {
  participantIds: string[];
  name?: string;
  type: 'DIRECT' | 'GROUP';
}

export interface SendMessageRequest {
  conversationId: string;
  senderId: string;
  content: string;
}
