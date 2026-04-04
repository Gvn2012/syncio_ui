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

/**
 * Login Data structure returned from http://syncio.site/api/v1/users/login
 */
export interface LoginData {
  accessToken: string;
  refreshToken: string;
  userId: string;
  userRole: 'User' | 'Admin';
}
