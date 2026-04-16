import type { Post } from '../types';
import type { PostCreateRequest } from '../types/post-request.types';

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

export type CreatePostRequest = PostCreateRequest;

export interface CreatePostResponse {
  post: Post;
}
