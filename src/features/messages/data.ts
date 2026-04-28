import { ConversationType } from './types';
import type { Conversation } from './types';

const MOCK_ORG_ID = '3e253011-8fc1-460d-83de-a9a3b689fd5b';
const EXTERNAL_ORG_ID = 'ext-org-789';

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    type: ConversationType.GROUP,
    name: 'Design & UX Sync',
    participants: ['a1b1c1d1', 'b2c2d2e2', 'c3d3e3f3'],
    participantDetails: [
      { id: 'a1b1c1d1', name: 'Elena Vance', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', role: 'Digital Curator', orgId: MOCK_ORG_ID, isOnline: true },
      { id: 'b2c2d2e2', name: 'Marcus Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', role: 'Project Lead', orgId: MOCK_ORG_ID, isOnline: true },
      { id: 'c3d3e3f3', name: 'Sarah Jenkins', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', role: 'Operations', orgId: MOCK_ORG_ID, isOnline: false }
    ],
    lastMessage: {
      id: 'm1', conversationId: '1', senderId: 'b2c2d2e2', content: 'I think the backdrop-blur levels are finally stable.', timestamp: '2023-11-20T10:30:00Z', status: {}, isEdited: false, isRecalled: false
    },
    unreadCount: 3,
    updatedAt: '2023-11-20T10:30:00Z'
  },
  {
    id: '2',
    name: '',
    type: ConversationType.DIRECT,
    participants: ['b2c2d2e2'],
    participantDetails: [
      { id: 'b2c2d2e2', name: 'Marcus Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', role: 'Project Lead', orgId: MOCK_ORG_ID, isOnline: true }
    ],
    lastMessage: {
      id: 'm2', conversationId: '2', senderId: 'b2c2d2e2', content: 'Can we sync on the Q3 strategy doc tomorrow?', timestamp: '2023-11-20T09:15:00Z', status: {}, isEdited: false, isRecalled: false
    },
    unreadCount: 0,
    updatedAt: '2023-11-20T09:15:00Z'
  },
  {
    id: '3',
    name: '',
    type: ConversationType.DIRECT,
    participants: ['ext-1'],
    participantDetails: [
      { id: 'ext-1', name: 'Marcus Aurelius', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aurelius', role: 'External Advisor', orgId: EXTERNAL_ORG_ID, isOnline: true }
    ],
    lastMessage: {
      id: 'm3', conversationId: '3', senderId: 'ext-1', content: 'The architectural review is complete.', timestamp: '2023-11-19T16:45:00Z', status: {}, isEdited: false, isRecalled: false
    },
    unreadCount: 1,
    updatedAt: '2023-11-19T16:45:00Z'
  },
  {
    id: '4',
    name: 'Ops Sync',
    type: ConversationType.GROUP,
    participants: ['d4e4f4g4', 'b2c2d2e2'],
    participantDetails: [
      { id: 'd4e4f4g4', name: 'David Miller', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', role: 'Infrastructure', orgId: MOCK_ORG_ID, isOnline: true },
      { id: 'b2c2d2e2', name: 'Marcus Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', role: 'Project Lead', orgId: MOCK_ORG_ID, isOnline: true }
    ],
    lastMessage: {
      id: 'm4', conversationId: '4', senderId: 'd4e4f4g4', content: 'Server maintenance scheduled for Saturday.', timestamp: '2023-11-18T14:20:00Z', status: {}, isEdited: false, isRecalled: false
    },
    unreadCount: 0
  }
];

export const mockMessages = {
  'conv-1': [
    { id: 'msg-1', conversationId: 'conv-1', senderId: 'c3d3e3f3', text: 'Hey team, any updates on the design system?', timestamp: '2024-04-04T09:00:00Z', isRead: true, status: 'read' as const },
    { id: 'msg-2', conversationId: 'conv-1', senderId: 'b2c2d2e2', text: 'Elena was working on the tonal layering patterns.', timestamp: '2024-04-04T09:15:00Z', isRead: true, status: 'read' as const },
    { id: 'msg-3', conversationId: 'conv-1', senderId: 'a1b1c1d1', text: 'The new tonal layering patterns are ready for review.', timestamp: '2024-04-04T10:40:00Z', isRead: true, status: 'read' as const },
    { id: 'msg-4', conversationId: 'conv-1', senderId: 'a1b1c1d1', text: 'I think the backdrop-blur levels are finally stable.', timestamp: '2024-04-04T10:45:00Z', isRead: false, status: 'delivered' as const }
  ],
  'conv-2': [
    { id: 'msg-5', conversationId: 'conv-2', senderId: 'b2c2d2e2', text: 'Can we sync on the Q3 strategy doc tomorrow?', timestamp: '2024-04-03T16:00:00Z', isRead: true, status: 'read' as const },
    { id: 'msg-6', conversationId: 'conv-2', senderId: 'currentUser', text: 'Sure, I have time at 11:00 AM.', timestamp: '2024-04-04T11:00:00Z', isRead: false, status: 'delivered' as const }
  ],
  'conv-ext': [
    { id: 'msg-ext-1', conversationId: 'conv-ext', senderId: 'ext-1', text: 'The architectural review is complete. I focused on organizational synchronization.', timestamp: '2024-04-04T09:00:00Z', isRead: true, status: 'read' as const }
  ]
};
