export enum PostCategory {
  NORMAL = 'NORMAL',
  POLL = 'POLL',
  EVENT = 'EVENT',
  TASK = 'TASK',
  ANNOUNCEMENT = 'ANNOUNCEMENT'
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
  BANNED = 'BANNED',
  RESTRICTED = 'RESTRICTED'
}

export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  COMPANY = 'COMPANY',
  FOLLOWER = 'FOLLOWER',
  GROUP = 'GROUP',
  PRIVATE = 'PRIVATE'
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Author {
  id: string; // UUID
  name: string;
  avatar: string;
  role?: string;
}

export interface AuditableEntity {
  id: string; // UUID
  orgId: string; // UUID
  createdAt: string; // ISO DateTime
  updatedAt: string; // ISO DateTime
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface PostPoll {
  postId: string;
  question: string;
  allowMultipleAnswers: boolean;
  maxOptionsSelected: number;
  expiresAt?: string;
  isClosed: boolean;
  totalVotes: number;
  options: PollOption[];
}

export interface PostTask {
  postId: string;
  title: string;
  description?: string;
  dueAt?: string;
  priority: string;
  status: TaskStatus;
  completedAt?: string;
}

export interface PostAnnouncement {
  postId: string;
  priority: string;
  isPinned: boolean;
  pinnedUntil?: string;
  requiresAcknowledgement: boolean;
  readCount: number;
}

export interface PostMediaAttachment {
  id: string;
  url: string;
  uploadUrl?: string;
  fileName?: string;
  type: string;
  position?: number;
}

export interface Post extends AuditableEntity {
  postCategory: PostCategory;
  authorId: string;
  author?: Author; // Transformed from ID for UI
  content: string;
  contentHtml?: string;
  excerpt?: string;
  language: string;
  visibility: PostVisibility;
  status: PostStatus;
  publishedAt: string;
  commentCount: number;
  reactionCount: number;
  shareCount: number;
  viewCount: string;
  isShared: boolean;
  isPinned: boolean;
  
  // Extension Relations
  poll?: PostPoll;
  task?: PostTask;
  announcement?: PostAnnouncement;
  attachments?: PostMediaAttachment[];
  
  // UI helpers (legacy compatibility)
  likes: number; // mapped to reactionCount
  comments: number; // mapped to commentCount
  isLiked?: boolean;
}

