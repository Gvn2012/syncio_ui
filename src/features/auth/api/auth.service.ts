import api from '../../../api/api';
import { type APIResource, type LoginData } from '../../../api/types/api-resource';

export const authService = {
  /**
   * Send login credentials to the backend.
   * URI: http://syncio.site/api/v1/users/login
   */
  login: async (credentials: any): Promise<APIResource<LoginData>> => {
    const response = await api.post<APIResource<LoginData>>('users/login', credentials);
    return response.data;
  },
  
  /**
   * Check if username or email is available.
   * URI: http://syncio.site/api/v1/users/check-username-email-availability?email=&username=
   */
  checkAvailability: async (email: string, username: string): Promise<APIResource<{ isEmailAvailable: boolean, isUsernameAvailable: boolean }>> => {
    const response = await api.get<APIResource<{ isEmailAvailable: boolean, isUsernameAvailable: boolean }>>(
      `users/check-username-email-availability?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`
    );
    return response.data;
  },
  
  /**
   * Registration placeholder (can be expanded later)
   */
  register: async (userData: any): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>('users/register', userData);
    return response.data;
  }
};
