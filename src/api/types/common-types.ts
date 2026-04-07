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
