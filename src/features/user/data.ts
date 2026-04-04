import type { User } from './types';
import { 
  Gender, 
  EmploymentType, 
  EmploymentStatus 
} from './types';
import avatarCurator from '../../assets/demo/avatar_curator.png';

export const currentUser: User = {
  id: 'a1b1c1d1-e1f1-41d1-a1b1-c1d1e1f1a1b1',
  username: 'evance_curator',
  firstName: 'Elena',
  lastName: 'Vance',
  gender: Gender.FEMALE,
  active: true,
  banned: false,
  suspended: false,
  locale: 'en',
  timezone: 'UTC',
  profile: {
    id: 'p1',
    bio: 'Digital Curator & Workspace Strategist. Passionate about high-utilization design and cognitive ergonomics.',
    location: 'Remote / London',
    website: 'https://syncio.site/evance',
    profileCompletedScore: 92,
    avatarUrl: avatarCurator
  },
  employments: [
    {
      id: 'emp1',
      organizationId: '3e253011-8fc1-460d-83de-a9a3b689fd5b',
      organizationName: 'SyncIO Enterprise',
      departmentName: 'Creative Operations',
      jobTitle: 'Senior Digital Curator',
      employmentType: EmploymentType.FULL_TIME,
      employmentStatus: EmploymentStatus.ACTIVE,
      hireDate: '2023-01-15',
      workLocation: 'Hybrid',
      isCurrent: true
    }
  ],
  skills: [
    { id: 's1', name: 'UI/UX Design', level: 'EXPERT', yearsOfExperience: 8 },
    { id: 's2', name: 'Information Architecture', level: 'ADVANCED', yearsOfExperience: 5 },
    { id: 's3', name: 'Cognitive Ergonomics', level: 'INTERMEDIATE', yearsOfExperience: 3 }
  ],
  preferences: {
    darkMode: true,
    notifications: {
      email: true,
      push: true
    }
  }
};
