import api from '../../../api/api';
import { 
  type APIResource, 
  type LoginData, 
  type EmailVerificationResponse, 
  type RegisterData 
} from '../../../api/types/api-resource';

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
   * Step 1: Request an email verification code.
   * URI: POST http://syncio.site/api/v1/users/email-verifications
   */
  requestEmailVerification: async (email: string): Promise<APIResource<EmailVerificationResponse>> => {
    const response = await api.post<APIResource<EmailVerificationResponse>>('users/email-verifications', { email });
    return response.data;
  },

  /**
   * Step 2: Verify the 6-digit OTP code.
   * URI: POST http://syncio.site/api/v1/users/email-verifications/{id}/verify
   */
  verifyEmail: async (emailVerificationId: string, code: string): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>(`users/email-verifications/${emailVerificationId}/verify`, { code });
    return response.data;
  },

  /**
   * Step 3: Resend the OTP code.
   * URI: POST http://syncio.site/api/v1/users/email-verifications/{id}/resend
   */
  resendEmailVerification: async (emailVerificationId: string): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>(`users/email-verifications/${emailVerificationId}/resend`);
    return response.data;
  },
  
  /**
   * Step 4: Final account registration.
   * URI: POST http://syncio.site/api/v1/users/register
   */
  register: async (userData: RegisterData): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>('users/register', userData);
    return response.data;
  }
};
