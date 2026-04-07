export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface GetMessagesRequest {
  chatId: string;
  page?: number;
  limit?: number;
}

export interface GetMessagesResponse {
  messages: Message[];
  total: number;
}

export interface SendMessageRequest {
  recipientId: string;
  content: string;
}

export interface SendMessageResponse {
  message: Message;
}
