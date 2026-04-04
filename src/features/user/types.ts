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
