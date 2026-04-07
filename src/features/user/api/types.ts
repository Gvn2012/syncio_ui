import type { User, UserProfile } from '../types';

export interface GetUserProfileRequest {
  id: string;
}

export interface GetUserProfileResponse {
  user: User;
}

export interface UpdateUserProfileRequest {
  bio?: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
}

export interface UpdateUserProfileResponse {
  user: User;
}

export interface GetUserListRequest {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetUserListResponse {
  users: User[];
  total: number;
}
