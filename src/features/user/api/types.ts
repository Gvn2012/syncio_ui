import type { User, UserDetailResponse } from '../types';

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

/** Response type for GET /api/v1/users?id=userId */
export type GetUserDetailResponse = UserDetailResponse;

// --- Relationship Types ---

export type FriendRequestStatus = 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED' | 'REJECTED';

export interface RelationshipStatusResponse {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isFriend: boolean;
  isBlocking: boolean;
  isBlockedBy: boolean;
  friendRequestStatus: FriendRequestStatus;
  friendRequestId?: string;
}

export interface RelationshipUserSummaryResponse {
  relationshipId: string;
  userId: string;
  username: string | null;
  displayName: string;
  profilePictureUrl: string | null;
  relationshipType: 'FRIEND' | 'FOLLOW' | null;
  mutualFriendsCount?: number;
  createdAt: string;
}

export interface PendingFriendRequestResponse {
  requestId: string;
  senderUserId: string;
  receiverUserId: string;
  otherUserId: string;
  direction: 'SENT' | 'RECEIVED';
  username: string | null;
  displayName: string;
  profilePictureUrl: string | null;
  message?: string;
  seen: boolean;
  createdAt: string;
}



export type BlockReason = 
  | 'HARASSMENT' 
  | 'SPAM' 
  | 'INAPPROPRIATE_CONTENT' 
  | 'UNWANTED_CONTACT' 
  | 'IMPERSONATION' 
  | 'PERSONAL' 
  | 'OTHER';

export type PendingRequestDirection = 'ALL' | 'RECEIVED' | 'SENT';
