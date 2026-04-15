import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { 
  RelationshipStatusResponse, 
  RelationshipUserSummaryResponse, 
  PendingFriendRequestResponse, 
  PageResponse,
  BlockReason,
  PendingRequestDirection
} from './types';

export const RelationshipService = {
  /**
   * Get relationship status between current user and target user.
   */
  getStatus: async (targetId: string): Promise<RelationshipStatusResponse> => {
    const response = await api.get<any>(`rs/relationships/status/${targetId}`);
    const data = response.data;
    return {
      isFollowing: data.following,
      isFollowedBy: data.followedBy,
      isFriend: data.friend,
      isBlocking: data.blocking,
      isBlockedBy: data.blockedBy,
      friendRequestStatus: data.friendRequestStatus,
      friendRequestId: data.friendRequestId
    } as RelationshipStatusResponse;
  },


  follow: async (targetId: string): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>(`rs/relationships/follow/${targetId}`);
    return response.data;
  },


  unfollow: async (targetId: string): Promise<APIResource<void>> => {
    const response = await api.post<APIResource<void>>(`rs/relationships/unfollow/${targetId}`);
    return response.data;
  },

  sendFriendRequest: async (targetId: string, message: string = "Hi! Let's be friends."): Promise<APIResource<void>> => {
    const response = await api.post<APIResource<void>>('rs/friend-requests/send', { targetUserId: targetId, message });
    return response.data;
  },

  /**
   * Accept a friend request.
   */
  acceptFriendRequest: async (requestId: string): Promise<APIResource<void>> => {
    const response = await api.post<APIResource<void>>(`rs/friend-requests/accept/${requestId}`);
    return response.data;
  },

  /**
   * Decline a friend request.
   */
  declineFriendRequest: async (requestId: string): Promise<APIResource<void>> => {
    const response = await api.post<APIResource<void>>(`rs/friend-requests/decline/${requestId}`);
    return response.data;
  },

  /**
   * Cancel a friend request (sender side).
   */
  cancelFriendRequest: async (requestId: string): Promise<APIResource<void>> => {
    const response = await api.post<APIResource<void>>(`rs/friend-requests/cancel/${requestId}`);
    return response.data;
  },

  /**
   * Unfriend a user.
   */
  unfriend: async (targetId: string): Promise<APIResource<void>> => {
    const response = await api.post<APIResource<void>>(`rs/relationships/unfriend/${targetId}`);
    return response.data;
  },


  block: async (targetId: string, reason: BlockReason = 'OTHER', notes: string = ''): Promise<APIResource<void>> => {
    const params = new URLSearchParams();
    if (reason) params.append('reason', reason);
    if (notes) params.append('notes', notes);
    
    const response = await api.post<APIResource<void>>(`rs/blocks/${targetId}?${params.toString()}`);
    return response.data;
  },


  unblock: async (targetId: string): Promise<APIResource<void>> => {
    const response = await api.delete<APIResource<void>>(`rs/blocks/${targetId}`);
    return response.data;
  },

  getFriendsPage: async (userId: string, page: number = 0, size: number = 20): Promise<APIResource<PageResponse<RelationshipUserSummaryResponse>>> => {
    const response = await api.get<APIResource<PageResponse<RelationshipUserSummaryResponse>>>(
      `rs/relationships/friends/${userId}/page`, 
      { params: { page, size } }
    );
    return response.data;
  },

  getFollowersPage: async (userId: string, page: number = 0, size: number = 20): Promise<APIResource<PageResponse<RelationshipUserSummaryResponse>>> => {
    const response = await api.get<APIResource<PageResponse<RelationshipUserSummaryResponse>>>(
      `rs/relationships/followers/${userId}/page`, 
      { params: { page, size } }
    );
    return response.data;
  },

  /**
   * Get paged list of pending friend requests.
   */
  getPendingRequests: async (direction: PendingRequestDirection = 'ALL', page: number = 0, size: number = 20): Promise<APIResource<PageResponse<PendingFriendRequestResponse>>> => {
    const response = await api.get<APIResource<PageResponse<PendingFriendRequestResponse>>>(
      'rs/friend-requests/pending', 
      { params: { direction, page, size } }
    );
    return response.data;
  },

  /**
   * Get list of blocked user IDs.
   */
  getBlocksIds: async (): Promise<APIResource<string[]>> => {
    const response = await api.get<APIResource<string[]>>('rs/relationships/blocks');
    return response.data;
  },

  /**
   * Get list of following user IDs.
   */
  getFollowingIds: async (userId: string): Promise<APIResource<string[]>> => {
    const response = await api.get<APIResource<string[]>>(`rs/relationships/following/${userId}`);
    return response.data;
  },
 
  /**
   * Get paged list of following.
   */
  getFollowingPage: async (userId: string, page: number = 0, size: number = 20): Promise<APIResource<PageResponse<RelationshipUserSummaryResponse>>> => {
    const response = await api.get<APIResource<PageResponse<RelationshipUserSummaryResponse>>>(
      `rs/relationships/following/${userId}/page`, 
      { params: { page, size } }
    );
    return response.data;
  },
 
  /**
   * Get paged list of blocked users.
   */
  getBlockedPage: async (page: number = 0, size: number = 20): Promise<APIResource<PageResponse<RelationshipUserSummaryResponse>>> => {
    const response = await api.get<APIResource<PageResponse<RelationshipUserSummaryResponse>>>(
      'rs/relationships/blocked/page', 
      { params: { page, size } }
    );
    return response.data;
  }
};
