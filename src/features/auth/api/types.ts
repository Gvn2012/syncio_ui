import type { AddressData, EmergencyContactData } from '../../../api/types/common-types';
import type { OrganizationData } from '../../org/api/types';

export interface LoginRequest {
  username: string;
  password: string;
  organizationId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  userRole: 'User' | 'Admin';
  orgId: string;
}

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationResponse {
  emailVerificationId: string;
  email: string;
  resendAfterSeconds: number;
}

export interface VerifyEmailRequest {
  code: string;
}

export interface CheckAvailabilityRequest {
  email?: string;
  username?: string;
}

export interface CheckAvailabilityResponse {
  isEmailAvailable: boolean;
  isUsernameAvailable: boolean;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  emailVerificationId: string;
  phoneCode: string;
  phoneNumber: string;
  dateBirth: string;
  gender: string;
  profileImageId?: string;
  addresses?: AddressData[];
  emergencyContacts?: EmergencyContactData[];
  organization?: OrganizationData;
  registrationType: string;
}
