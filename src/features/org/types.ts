import { OrganizationSize } from '../../api/types/common-types';
export { OrganizationSize };

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export interface Department {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  parentDepartmentId?: string;
  headUserId?: string;
}

export interface Team {
  id: string;
  name: string;
  slug?: string;
  departmentId: string;
  description?: string;
  leadUserId?: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  jobTitle?: string;
  joinedAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Organization {
  id: string;
  name: string;
  legalName?: string;
  slug?: string;
  description?: string;
  industry?: string;
  website?: string;
  logoUrl?: string;
  foundedDate?: string;
  organizationSize: OrganizationSize;
  status: OrganizationStatus;
  ownerId: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  departments: Department[];
  teams: Team[];
}
