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
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
}

export interface PostCreateRequest {
  content: string;
  contentHtml?: string;
  excerpt?: string;
  language?: string;
  postCategory: PostCategory;
  visibility: PostVisibility;
  orgId: string;
  attachments?: MediaAttachmentRequest[];
  mentions?: string[]; // UUID strings
  tags?: string[];
  metadata?: string; // JSON string
  latitude?: number;
  longitude?: number;
  watchers?: string[]; // For Tasks
  coOrganizers?: string[]; // For Events
}

export interface PostEventRequest {
  title: string;
  description?: string;
  startAt: string; // ISO string
  endAt: string; // ISO string
  isAllDay: boolean;
  locationName?: string;
}

export interface PostTaskRequest {
  title: string;
  description: string;
  priority: PostPriority;
  dueAt: string; // ISO string
  assignees: string[]; // UUID strings
}

export interface PollOptionRequest {
  optionText: string;
  displayOrder: number;
}

export interface PostPollRequest {
  question: string;
  allowMultipleAnswers: boolean;
  maxOptionsSelected: number;
  expiresAt: string; // ISO string
  options: PollOptionRequest[];
}

export enum AnnouncementScope {
  ORGANIZATION = 'ORGANIZATION',
  DEPARTMENT = 'DEPARTMENT',
  TEAM = 'TEAM'
}

export interface PostAnnouncementRequest {
  priority: PostPriority;
  isPinned: boolean;
  pinnedUntil?: string; // ISO string
  requiresAcknowledgement: boolean;
  scope: AnnouncementScope;
  title?: string;
  content?: string; // Content for structured announcements
}
