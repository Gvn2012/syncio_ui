import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { 
  LoginRequest, 
  LoginResponse, 
  EmailVerificationRequest,
  EmailVerificationResponse, 
  VerifyEmailRequest,
  CheckAvailabilityResponse,
  RegisterRequest 
} from './types';

export const authService = {
 
  login: async (credentials: LoginRequest): Promise<APIResource<LoginResponse>> => {
    const response = await api.post<APIResource<LoginResponse>>('users/login', credentials);
    return response.data;
  },
  

  checkAvailability: async (email?: string, username?: string): Promise<APIResource<CheckAvailabilityResponse>> => {
    const query = new URLSearchParams();
    if (email) query.append('email', email);
    if (username) query.append('username', username);
    
    const response = await api.get<APIResource<CheckAvailabilityResponse>>(
      `users/check-username-email-availability?${query.toString()}`
    );
    return response.data;
  },

  requestEmailVerification: async (email: string): Promise<APIResource<EmailVerificationResponse>> => {
    const request: EmailVerificationRequest = { email };
    const response = await api.post<APIResource<EmailVerificationResponse>>('users/email-verifications', request);
    return response.data;
  },

  verifyEmail: async (emailVerificationId: string, code: string): Promise<APIResource<any>> => {
    const request: VerifyEmailRequest = { code };
    const response = await api.post<APIResource<any>>(`users/email-verifications/${emailVerificationId}/verify`, request);
    return response.data;
  },

  resendEmailVerification: async (emailVerificationId: string): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>(`users/email-verifications/${emailVerificationId}/resend`);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<APIResource<any>> => {
    const response = await api.post<APIResource<any>>('users/register', userData);
    return response.data;
  }
};
