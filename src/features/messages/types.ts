export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP'
}

export enum MessageStatusType {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  SEEN = 'SEEN'
}

export interface StatusInfo {
  status: MessageStatusType;
  updateTime: string;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  orgId?: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  status: Record<string, StatusInfo>;
  isEdited: boolean;
  isDeleted: boolean;
  updatedAt?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  participants: string[];
  participantDetails?: Participant[];
  lastMessage?: Message;
  unreadCount?: number;
  isPinned?: boolean;
  deletedAtPerUser?: Record<string, string>;
}

export interface MessageResponse extends Message {}
