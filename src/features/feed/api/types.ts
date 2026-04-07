import type { Post } from '../types';

export interface GetFeedRequest {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export interface GetFeedResponse {
  items: Post[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreatePostRequest {
  content: string;
  category: string;
  visibility: string;
  attachments?: { url: string; type: string }[];
}

export interface CreatePostResponse {
  post: Post;
}
