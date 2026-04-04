import type { Organization } from './types';
import { 
  OrganizationSize, 
  OrganizationStatus 
} from './types';

export const demoOrg: Organization = {
  id: '3e253011-8fc1-460d-83de-a9a3b689fd5b',
  name: 'SyncIO Enterprise',
  legalName: 'SyncIO Solutions Ltd.',
  slug: 'syncio-enterprise',
  description: 'A dedicated platform for high-utilization workspace management and cognitive ergonomics.',
  industry: 'Software & Technology',
  website: 'https://syncio.site',
  logoUrl: 'https://ui-avatars.com/api/?name=SyncIO&background=2596be&color=fff',
  organizationSize: OrganizationSize.MEDIUM,
  status: OrganizationStatus.ACTIVE,
  ownerId: 'a1b1c1d1-e1f1-41d1-a1b1-c1d1e1f1a1b1',
  address: '123 Innovation Dr',
  city: 'London',
  country: 'United Kingdom',
  departments: [
    {
      id: 'd1',
      name: 'Creative Operations',
      slug: 'creative-ops',
      description: 'Managing high-whitespace design strategies and digital ergonomics.'
    },
    {
      id: 'd2',
      name: 'Engineering',
      slug: 'engineering',
      description: 'Building the core SyncIO platform.'
    }
  ],
  teams: [
    {
      id: 't1',
      name: 'Design System Team',
      slug: 'design-system',
      departmentId: 'd1',
      description: 'Maintaining the Digital Curator design system.'
    }
  ]
};
