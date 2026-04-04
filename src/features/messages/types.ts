export enum ConversationType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP'
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: string;
  orgId: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  status: 'sent' | 'delivered' | 'read';
  images?: string[];
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  avatar?: string;
  participants: Participant[];
  lastMessage?: {
    text: string;
    timestamp: string;
    senderName: string;
  };
  unreadCount: number;
  isPinned?: boolean;
}
