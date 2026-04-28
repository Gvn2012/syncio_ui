import type { Post } from './types';
import { PostCategory, PostStatus, PostVisibility, TaskStatus } from './types';
import avatarCurator from '../../assets/demo/avatar_curator.png';

const MOCK_ORG_ID = '3e253011-8fc1-460d-83de-a9a3b689fd5b';

export const demoFeedItems: Post[] = [
  {
    id: 'e012c8b1-4f1d-4b7b-8322-a5d8b8e0192a',
    orgId: MOCK_ORG_ID,
    createdAt: '2024-04-04T12:00:00Z',
    updatedAt: '2024-04-04T12:00:00Z',
    postCategory: PostCategory.NORMAL,
    authorId: 'a1b1c1d1-e1f1-41d1-a1b1-c1d1e1f1a1b1',
    author: {
      id: 'a1b1c1d1-e1f1-41d1-a1b1-c1d1e1f1a1b1',
      name: 'Elena Vance',
      avatar: avatarCurator,
      role: 'Digital Curator'
    },
    content: 'Just finalized the new workspace layout for the Creative Team. We focusing on high whitespace and natural lighting to boost focus and reduce digital fatigue. What do you think?',
    language: 'en',
    visibility: PostVisibility.COMPANY,
    status: PostStatus.PUBLISHED,
    publishedAt: '2 hours ago',
    commentCount: 5,
    reactionCount: 24,
    shareCount: 2,
    viewCount: 156,
    isShared: false,
    isPinned: false,
    likes: 24,
    comments: 5,
    attachments: [
      { id: 'att-1', url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80', type: 'IMAGE', fileName: 'planning.jpg', position: 0, mimeType: 'image/jpeg', uploadStatus: 'SUCCESSFUL' }
    ]
  },
  {
    id: 'f123c8b1-4f1d-4b7b-8322-a5d8b8e0192b',
    orgId: MOCK_ORG_ID,
    createdAt: '2024-04-04T09:00:00Z',
    updatedAt: '2024-04-04T09:00:00Z',
    postCategory: PostCategory.TASK,
    authorId: 'b2c2d2e2-f2a2-42d2-b2c2-d2e2f2a2b2c2',
    author: {
      id: 'b2c2d2e2-f2a2-42d2-b2c2-d2e2f2a2b2c2',
      name: 'Marcus Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
      role: 'Project Lead'
    },
    content: 'Please review the Q3 Strategy sync document and provide your feedback by EOD Friday.',
    language: 'en',
    visibility: PostVisibility.COMPANY,
    status: PostStatus.PUBLISHED,
    publishedAt: '5 hours ago',
    commentCount: 8,
    reactionCount: 12,
    shareCount: 0,
    viewCount: 450,
    isShared: false,
    isPinned: false,
    likes: 12,
    comments: 8,
    task: {
      postId: 'f123c8b1-4f1d-4b7b-8322-a5d8b8e0192b',
      title: 'Review Q3 Strategy',
      description: 'Feedback required for upcoming quarterly review.',
      dueAt: '2024-04-07',
      priority: 'URGENT',
      status: TaskStatus.IN_PROGRESS
    }
  },
  {
    id: 'g345c8b1-4f1d-4b7b-8322-a5d8b8e0192c',
    orgId: MOCK_ORG_ID,
    createdAt: '2024-04-03T10:00:00Z',
    updatedAt: '2024-04-03T10:00:00Z',
    postCategory: PostCategory.POLL,
    authorId: 'c3d3e3f3-a3b3-43d3-c3d3-e3f3a3b3c3d3',
    author: {
      id: 'c3d3e3f3-a3b3-43d3-c3d3-e3f3a3b3c3d3',
      name: 'Sarah Jenkins',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      role: 'Operations'
    },
    content: 'Where should we host the Q2 Team Offsite? We looking for a balance between relaxation and brainstorming.',
    language: 'en',
    visibility: PostVisibility.PUBLIC,
    status: PostStatus.PUBLISHED,
    publishedAt: '1 day ago',
    commentCount: 32,
    reactionCount: 45,
    shareCount: 5,
    viewCount: 2300,
    isShared: false,
    isPinned: false,
    likes: 45,
    comments: 32,
    poll: {
      postId: 'g345c8b1-4f1d-4b7b-8322-a5d8b8e0192c',
      question: 'Where should we host the Q2 Team Offsite?',
      allowMultipleAnswers: false,
      maxOptionsSelected: 1,
      isClosed: false,
      totalVotes: 45,
      options: [
        { id: 'o1', text: 'Mountain Retreat', voteCount: 18 },
        { id: 'o2', text: 'Coastal Workshop', voteCount: 22 },
        { id: 'o3', text: 'Urban Innovation Hub', voteCount: 5 }
      ]
    }
  },
  {
    id: 'h567c8b1-4f1d-4b7b-8322-a5d8b8e0192d',
    orgId: MOCK_ORG_ID,
    createdAt: '2024-04-02T08:00:00Z',
    updatedAt: '2024-04-02T08:00:00Z',
    postCategory: PostCategory.ANNOUNCEMENT,
    authorId: 'a1b1c1d1-e1f1-41d1-a1b1-c1d1e1f1a1b1',
    author: {
      id: 'a1b1c1d1-e1f1-41d1-a1b1-c1d1e1f1a1b1',
      name: 'Elena Vance',
      avatar: avatarCurator,
      role: 'Digital Curator'
    },
    content: 'SyncIO v2.4 is now live for all standalone users. Key features include improved thread management and a new dark mode system optimized for reading.',
    language: 'en',
    visibility: PostVisibility.PUBLIC,
    status: PostStatus.PUBLISHED,
    publishedAt: '2 days ago',
    commentCount: 15,
    reactionCount: 120,
    shareCount: 10,
    viewCount: 5600,
    isShared: false,
    isPinned: true,
    likes: 120,
    comments: 15,
    announcement: {
      postId: 'h567c8b1-4f1d-4b7b-8322-a5d8b8e0192d',
      priority: 'HIGH',
      isPinned: true,
      requiresAcknowledgement: true,
      readCount: 1240
    }
  },
  {
    id: 'i890c8b1-4f1d-4b7b-8322-a5d8b8e0192e',
    orgId: MOCK_ORG_ID,
    createdAt: '2024-04-01T15:00:00Z',
    updatedAt: '2024-04-01T15:00:00Z',
    postCategory: PostCategory.TASK,
    authorId: 'a1b1c1d1-e1f1-41d1-a1b1-c1d1e1f1a1b1',
    author: {
      id: 'a1b1c1d1-e1f1-41d1-a1b1-c1d1e1f1a1b1',
      name: 'Elena Vance',
      avatar: avatarCurator,
      role: 'Digital Curator'
    },
    content: 'Update branding guidelines for the new design system expansion.',
    language: 'en',
    visibility: PostVisibility.COMPANY,
    status: PostStatus.PUBLISHED,
    publishedAt: '3 days ago',
    commentCount: 3,
    reactionCount: 15,
    shareCount: 1,
    viewCount: 89,
    isShared: false,
    isPinned: false,
    likes: 15,
    comments: 3,
    task: {
      postId: 'i890c8b1-4f1d-4b7b-8322-a5d8b8e0192e',
      title: 'Update Branding Guidelines',
      description: 'Need to incorporate the new tonal layering patterns.',
      dueAt: '2024-04-10',
      priority: 'NORMAL',
      status: TaskStatus.OPEN
    }
  },
  {
    id: 'j901c8b1-4f1d-4b7b-8322-a5d8b8e0192f',
    orgId: MOCK_ORG_ID,
    createdAt: '2024-03-25T12:00:00Z',
    updatedAt: '2024-03-25T12:00:00Z',
    postCategory: PostCategory.TASK,
    authorId: 'b2c2d2e2-f2a2-42d2-b2c2-d2e2f2a2b2c2',
    author: {
      id: 'b2c2d2e2-f2a2-42d2-b2c2-d2e2f2a2b2c2',
      name: 'Marcus Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
      role: 'Project Lead'
    },
    content: 'Schedule Q2 performance sync with the engineering lead.',
    language: 'en',
    visibility: PostVisibility.COMPANY,
    status: PostStatus.PUBLISHED,
    publishedAt: '1 week ago',
    commentCount: 1,
    reactionCount: 5,
    shareCount: 0,
    viewCount: 210,
    isShared: false,
    isPinned: false,
    likes: 5,
    comments: 1,
    task: {
      postId: 'j901c8b1-4f1d-4b7b-8322-a5d8b8e0192f',
      title: 'Q2 Performance Sync',
      description: 'Discuss team velocity and resource allocation.',
      dueAt: '2024-04-05',
      priority: 'NORMAL',
      status: TaskStatus.COMPLETED
    }
  },
  {
    id: 'k012c8b1-4f1d-4b7b-8322-a5d8b8e0193a',
    orgId: MOCK_ORG_ID,
    createdAt: '2024-04-01T09:00:00Z',
    updatedAt: '2024-04-01T09:00:00Z',
    postCategory: PostCategory.ANNOUNCEMENT,
    authorId: 'c3d3e3f3-a3b3-43d3-c3d3-e3f3a3b3c3d3',
    author: {
      id: 'c3d3e3f3-a3b3-43d3-c3d3-e3f3a3b3c3d3',
      name: 'Sarah Jenkins',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      role: 'Operations'
    },
    content: 'Upcoming Server Maintenance: Saturday April 6th. Core infrastructure will undergo scheduled maintenance from 02:00 to 04:00 UTC.',
    language: 'en',
    visibility: PostVisibility.PUBLIC,
    status: PostStatus.PUBLISHED,
    publishedAt: '3 days ago',
    commentCount: 8,
    reactionCount: 45,
    shareCount: 2,
    viewCount: 1500,
    isShared: false,
    isPinned: false,
    likes: 45,
    comments: 8,
    announcement: {
      postId: 'k012c8b1-4f1d-4b7b-8322-a5d8b8e0193a',
      priority: 'NORMAL',
      isPinned: false,
      requiresAcknowledgement: false,
      readCount: 560
    }
  }
];



export const mockDepartments = [
  { id: 'dept-1', name: 'Engineering', code: 'ENG' },
  { id: 'dept-2', name: 'Product Management', code: 'PM' },
  { id: 'dept-3', name: 'Design & UX', code: 'DSN' },
  { id: 'dept-4', name: 'Marketing', code: 'MKT' },
  { id: 'dept-5', name: 'Human Resources', code: 'HR' },
  { id: 'dept-6', name: 'Customer Support', code: 'CS' },
];

export const mockTeams = [
  { id: 'team-1', name: 'Core Infrastructure', deptId: 'dept-1' },
  { id: 'team-2', name: 'Mobile Experience', deptId: 'dept-1' },
  { id: 'team-3', name: 'Growth Pod', deptId: 'dept-1' },
  { id: 'team-4', name: 'Visual Identity', deptId: 'dept-3' },
  { id: 'team-5', name: 'Brand Strategy', deptId: 'dept-4' },
  { id: 'team-6', name: 'Talent Acquisition', deptId: 'dept-5' },
];
