import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { 
  GetUserProfileRequest, 
  GetUserProfileResponse, 
  UpdateUserProfileRequest, 
  UpdateUserProfileResponse,
  GetUserListRequest,
  GetUserListResponse
} from './types';

export const UserService = {
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
  }
};
