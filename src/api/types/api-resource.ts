export interface APIResource<T> {
  success: boolean;
  message: string;
  data: T;
  status: string;
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

export enum OrganizationSize {
  MICRO = 'MICRO',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ENTERPRISE = 'ENTERPRISE'
}

export interface AddressData {
  addressType: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  isPrimary?: boolean;
}

export interface EmergencyContactData {
  contactName: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  isPrimary?: boolean;
}

export interface OrganizationData {
  name: string;
  legalName?: string;
  slug: string;
  description?: string;
  industry?: string;
  website?: string;
  logoUrl?: string;
  foundedDate?: string;
  registrationNumber?: string;
  taxId?: string;
  organizationSize?: OrganizationSize;
  parentOrganizationId?: string;
}

export interface RegisterData {
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
}

