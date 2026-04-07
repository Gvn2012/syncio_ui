import type { OrganizationSize } from '../../../api/types/common-types';

export interface CheckOrgAvailabilityRequest {
    name: string;
}

export interface CheckOrgAvailabilityResponse {
    isNameAvailable: boolean;
    recommendedNames: string[];
}

export interface OrganizationData {
  name: string;
  legalName?: string;
  slug?: string;
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