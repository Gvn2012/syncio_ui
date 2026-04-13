import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';

export interface RelationshipStatusResponse {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isFriend: boolean;
  isBlocking: boolean;
  isBlockedBy: boolean;
  friendRequestStatus: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED' | 'REJECTED';
  friendRequestId?: string;
}

export const RelationshipService = {
  /**
   * Get relationship status between current user and target user.
   */
  getStatus: async (targetId: string): Promise<RelationshipStatusResponse> => {
    const response = await api.get<RelationshipStatusResponse>(`rs/relationships/status/${targetId}`);
    return response.data;
  },

  /**
   * Follow a user.
   */
  follow: async (targetId: string): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>(`rs/relationships/follow/${targetId}`);
    return response.data;
  },

  /**
   * Unfollow a user.
   */
  unfollow: async (targetId: string): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>(`rs/relationships/unfollow/${targetId}`);
    return response.data;
  },

  /**
   * Send a friend request.
   */
  sendFriendRequest: async (targetId: string, message: string = "Hi! Let's be friends."): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>('rs/friend-requests/send', { targetUserId: targetId, message });
    return response.data;
  },

  /**
   * Accept a friend request.
   */
  acceptFriendRequest: async (requestId: string): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>(`rs/friend-requests/accept/${requestId}`);
    return response.data;
  },

  /**
   * Decline a friend request.
   */
  declineFriendRequest: async (requestId: string): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>(`rs/friend-requests/decline/${requestId}`);
    return response.data;
  },

  /**
   * Unfriend a user.
   * Note: This usually involves removing the bidirectional FRIEND relationship.
   * We need to confirm if there's a specialized unfriend endpoint or if we use unfollow.
   * For now, we'll assume there's an unfriend or we use a general relationship removal.
   */
  unfriend: async (targetId: string): Promise<APIResource<any>> => {
    // If there is no specific unfriend endpoint, we might need one.
    // Assuming /rs/relationships/unfriend/{tid} exists or similar.
    const response = await api.post<APIResource<any>>(`rs/relationships/unfriend/${targetId}`);
    return response.data;
  },

  /**
   * Block a user.
   */
  block: async (targetId: string, reason: string = 'OTHER', notes: string = ''): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>(`rs/blocks/${targetId}`, { reason, notes });
    return response.data;
  },

  /**
   * Unblock a user.
   */
  unblock: async (targetId: string): Promise<APIResource<any>> => {
    const response = await api.delete<APIResource<any>>(`rs/blocks/${targetId}`);
    return response.data;
  }
};
