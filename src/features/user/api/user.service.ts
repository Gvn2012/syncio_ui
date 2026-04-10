import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { 
  GetUserProfileRequest, 
  GetUserProfileResponse, 
  UpdateUserProfileRequest, 
  UpdateUserProfileResponse,
  GetUserListRequest,
  GetUserListResponse,
  GetUserDetailResponse
} from './types';

export const UserService = {
  /**
   * Fetch full user detail by ID.
   * URI: GET http://syncio.site/api/v1/users?id={userId}
   */
  getUserDetail: async (userId: string): Promise<APIResource<GetUserDetailResponse>> => {
    const response = await api.get<APIResource<GetUserDetailResponse>>(`users?id=${userId}`);
    return response.data;
  },

  /**
   * Fetch a user profile by ID.
   * URI: GET http://syncio.site/api/v1/users/{id}
   */
  getUserProfile: async (params: GetUserProfileRequest): Promise<APIResource<GetUserProfileResponse>> => {
    const response = await api.get<APIResource<GetUserProfileResponse>>(`users/${params.id}`);
    return response.data;
  },

  /**
   * Update the current user's profile information.
   * URI: PUT http://syncio.site/api/v1/users/profile
   */
  updateProfile: async (data: UpdateUserProfileRequest): Promise<APIResource<UpdateUserProfileResponse>> => {
    const response = await api.put<APIResource<UpdateUserProfileResponse>>('users/profile', data);
    return response.data;
  },

  /**
   * Search for users in the organization.
   * URI: GET http://syncio.site/api/v1/users
   */
  getUsers: async (params: GetUserListRequest): Promise<APIResource<GetUserListResponse>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);

    const response = await api.get<APIResource<GetUserListResponse>>(`users?${query.toString()}`);
    return response.data;
  },

  /**
   * Update the user's profile picture using an image ID.
   * URI: PUT /api/v1/users/{uid}/profile-picture
   */
  updateProfilePicture: async (userId: string, imageId: string): Promise<APIResource<void>> => {
    const response = await api.put<APIResource<void>>(`users/${userId}/profile-picture`, { imageId });
    return response.data;
  }
};
