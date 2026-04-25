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

export enum ReactionType {
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE',
  LOVE = 'LOVE',
  ANGRY = 'ANGRY',
  SAD = 'SAD'
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface AuthorInfo {
  userId: string; 
  username: string;
  displayName: string;
  avatarUrl: string;
  avatarPath?: string;
  active: boolean;
  suspended: boolean;
  banned: boolean;
  role?: string; 
}

export interface AuditableEntity {
  id: string; 
  orgId: string; 
  createdAt: string; 
  updatedAt: string; 
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
  fileName: any;
  id: string;
  url: string;
  uploadUrl?: string;
  caption?: string;
  altText?: string;
  position: number;
  type: 'IMAGE' | 'VIDEO' | 'FILE';
  mimeType: string;
  uploadStatus: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  width?: number;
  height?: number;
  duration?: number;
  uploadedAt?: string;
}

export interface Post extends AuditableEntity {
  postCategory: PostCategory;
  authorId: string;
  authorInfo?: AuthorInfo;
  author?: { name: string; avatar: string; role: string }; // Legacy support
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
  viewCount: number;
  isShared: boolean;
  isPinned: boolean;
  viewerReaction?: ReactionType | null;
  sharedByViewer: boolean;
  
  poll?: PostPoll;
  task?: PostTask;
  announcement?: PostAnnouncement;
  attachments: PostMediaAttachment[];
  
  mentions: string[];
  tags: string[];
  metadata?: string;
  topReactions?: ReactionType[];
  
  likes?: number; 
  comments?: number; 
  isLiked?: boolean; 
}

export interface ReactorSummary {
  userId: string | null;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  isFriend: boolean;
  isBlocked: boolean;
}

export interface PostReactionGroup {
  reactionType: ReactionType;
  count: number;
  reactors: ReactorSummary[];
}

