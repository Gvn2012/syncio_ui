export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP'
}

export enum MessageStatusType {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  SEEN = 'SEEN'
}

export enum MessageContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  IMAGE_PENDING = 'IMAGE_PENDING',
  VIDEO_PENDING = 'VIDEO_PENDING',
  AUDIO_PENDING = 'AUDIO_PENDING',
  CALL_VOICE = 'CALL_VOICE',
  CALL_VIDEO = 'CALL_VIDEO'
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

export interface MediaItem {
  id: string;
  batchId: string;
  conversationId: string;
  fileName?: string;
  contentType?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO';
  status: 'INITIATED' | 'UPLOADED' | 'FAILED' | 'COMPLETED';
  bucketName?: string;
  metadata?: Record<string, any>;
  uploadUrl?: string;
  downloadUrl?: string;
  size?: number;
  duration?: number;
  resolution?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  batchId?: string;
  senderId: string;
  content: string;
  type?: MessageContentType;
  mediaId?: string;
  mediaUrl?: string;
  mediaSize?: number;
  mediaContentType?: string;
  mediaItems?: MediaItem[];
  timestamp: string;
  status: Record<string, StatusInfo>;
  isEdited: boolean;
  isRecalled: boolean;
  updatedAt?: string;
  isOptimistic?: boolean;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageResponse extends Message {}
