export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHERS = 'OTHERS',
  NOT_SPECIFIED = 'NOT_SPECIFIED'
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN'
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  TERMINATED = 'TERMINATED',
  PROBATION = 'PROBATION',
  ON_LEAVE = 'ON_LEAVE'
}


export interface UserResponse {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: string;
  locale: string;
  timezone: string | null;
  active: boolean;
  suspended: boolean;
  banned: boolean;
  mustChangePassword: boolean;
}

export interface UserEmailResponse {
  id: string;
  email: string;
  verified: boolean;
  primary: boolean;
  verifiedAt: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
}

export interface UserPhoneResponse {
  id: string;
  phoneNumber: string;
  verified: boolean;
  primary: boolean;
  verifiedAt: string | null;
  metadata: Record<string, unknown> | null;
}

export interface UserProfilePictureResponse {
  id: string;
  fileSize: number;
  height: number | null;
  width: number | null;
  url: string;
  objectPath: string;
  bucketName: string;
  mimeType: string;
  deleted: boolean;
  primary: boolean;
  metadata: Record<string, unknown> | null;
}

export interface UserProfileResponse {
  id: string;
  dateOfBirth: string | null;
  bio: string | null;
  location: string | null;
  contactInfo: Record<string, unknown>;
  profileCompletedScore: number;
  userProfilePictureResponseList: UserProfilePictureResponse[];
}

export interface UserAddressResponse {
  id: string;
  addressType: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  primary: boolean;
}

export interface EmergencyContactResponse {
  id: string;
  contactName: string;
  relationship: string;
  phoneNumber: string;
  email: string | null;
  primary: boolean;
  priority: number;
}

export interface UserEmploymentResponse {
  id: string;
  organizationId: string;
  organizationName: string;
  departmentId?: string;
  departmentName?: string;
  teamId?: string;
  teamName?: string;
  jobTitle: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  hireDate: string;
  probationEndDate?: string;
  workLocation?: string;
  isCurrent: boolean;
}

export interface UserSkillResponse {
  id: string;
  skillDefinitionId: string;
  skillName: string;
  proficiencyLevel: string;
  yearsOfExperience: number;
  verified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
}

export interface UserDetailResponse {
  userResponse: UserResponse;
  userEmailResponse: UserEmailResponse[];
  userPhoneResponse: UserPhoneResponse[];
  userProfileResponse: UserProfileResponse;
  addresses: UserAddressResponse[];
  emergencyContacts: EmergencyContactResponse[];
  employments: UserEmploymentResponse[];
  skills: UserSkillResponse[];
  preferences: Record<string, unknown>[];
}

export interface UserSkill {
  id: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsOfExperience?: number;
}

export interface UserEmployment {
  id: string;
  organizationId: string;
  organizationName: string;
  departmentId?: string;
  departmentName?: string;
  teamId?: string;
  teamName?: string;
  jobTitle: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  hireDate: string;
  probationEndDate?: string;
  workLocation?: string;
  isCurrent: boolean;
}

export interface UserProfile {
  id: string;
  bio?: string;
  dateOfBirth?: string;
  location?: string;
  website?: string;
  profileCompletedScore: number;
  avatarUrl?: string;
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: Gender;
  active: boolean;
  banned: boolean;
  suspended: boolean;
  locale: string;
  timezone: string;
  profile?: UserProfile;
  employments: UserEmployment[];
  skills: UserSkill[];
  preferences: Record<string, any>;
}
