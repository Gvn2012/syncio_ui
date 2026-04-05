/**
 * TypeScript equivalent of the Java APIResource<T> DTO.
 */
export interface APIResource<T> {
  success: boolean;
  message: string;
  data: T;
  status: string; // Corresponds to HttpStatus (e.g., "OK", "CREATED", "BAD_REQUEST")
  timestamp: string;
  error?: ErrorResource;
}

export interface ErrorResource {
  code?: string;
  message: string;
  detail?: string;
}

export interface LoginData {
  accessToken: string;
  refreshToken: string;
  userId: string;
  userRole: 'User' | 'Admin';
}

export interface EmailVerificationResponse {
  emailVerificationId: string;
  email: string;
  resendAfterSeconds: number;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  emailVerificationId: string;
  phoneNumber: string;
  dateBirth: string; // ISO format
}
