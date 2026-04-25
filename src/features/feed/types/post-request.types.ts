import { PostCategory } from '../types';

export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  ORGANIZATION = 'ORGANIZATION'
}

export enum PostPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface MediaAttachmentRequest {
  externalId?: string | null;
  url?: string | null;
  caption?: string;
  altText?: string;
  position: number;
  type: 'IMAGE' | 'VIDEO' | 'FILE' | 'MIXED';
  mimeType: string;
  sizeBytes: number;
  fileName: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

export interface PostCreateRequest {
  content?: string;
  contentHtml?: string;
  excerpt?: string;
  language: string;
  postCategory: PostCategory;
  visibility: PostVisibility;
  orgId: string | null;
  mentions?: string[];
  tags?: string[];
  metadata?: string;

  event?: PostEventRequest | null;
  poll?: PostPollRequest | null;
  task?: PostTaskRequest | null;
  announcement?: PostAnnouncementRequest | null;
  
  attachments?: MediaAttachmentRequest[];
}

export interface PostEventRequest {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  isVirtual: boolean;
  joinUrl?: string;
  maxParticipants?: number;
}

export interface PostTaskRequest {
  title: string;
  description?: string;
  priority: PostPriority;
  dueAt: string;
  assignees: string[];
}

export interface PollOptionRequest {
  optionText: string;
  position: number;
}

export interface PostPollRequest {
  question: string;
  allowMultipleAnswers: boolean;
  maxOptionsSelected: number;
  expiresAt: string;
  options: PollOptionRequest[];
}

export interface PostAnnouncementRequest {
  priority: PostPriority;
  isPinned: boolean;
  pinnedUntil?: string;
  requiresAcknowledgement: boolean;
}
