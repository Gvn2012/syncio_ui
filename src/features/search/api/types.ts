import type { PostStatus } from '../../feed/types';

export interface SearchPerson {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface SearchPost {
  id: string;
  authorId: string;
  content: string;
  publishedAt: string;
  status: PostStatus;
}

export interface UniversalSearchResponse {
  people: SearchPerson[];
  posts: SearchPost[];
  totalPeople: number;
  totalPosts: number;
  processingTimeMs: number;
}

export interface UniversalSearchRequest {
  q: string;
  page?: number;
  size?: number;
}
