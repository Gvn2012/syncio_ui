import { ConversationType } from './types';
import type { Conversation } from './types';

const MOCK_ORG_ID = '3e253011-8fc1-460d-83de-a9a3b689fd5b';
const EXTERNAL_ORG_ID = 'ext-org-789';

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    type: ConversationType.GROUP,
    name: 'Design & UX Sync',
    participants: [
      { id: 'a1b1c1d1', name: 'Elena Vance', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', role: 'Digital Curator', orgId: MOCK_ORG_ID, isOnline: true },
      { id: 'b2c2d2e2', name: 'Marcus Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', role: 'Project Lead', orgId: MOCK_ORG_ID, isOnline: true },
      { id: 'c3d3e3f3', name: 'Sarah Jenkins', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', role: 'Operations', orgId: MOCK_ORG_ID, isOnline: false }
    ],
    lastMessage: {
      text: 'I think the backdrop-blur levels are finally stable.',
      timestamp: '10:45 AM',
      senderName: 'Elena Vance'
    },
    unreadCount: 3,
    isPinned: true
  },
  {
    id: 'conv-2',
    type: ConversationType.INDIVIDUAL,
    name: 'Marcus Chen',
    participants: [
      { id: 'b2c2d2e2', name: 'Marcus Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', role: 'Project Lead', orgId: MOCK_ORG_ID, isOnline: true }
    ],
    lastMessage: {
      text: 'Can we sync on the Q3 strategy doc tomorrow?',
      timestamp: '1d ago',
      senderName: 'Marcus Chen'
    },
    unreadCount: 0
  },
  {
    id: 'conv-ext',
    type: ConversationType.INDIVIDUAL,
    name: 'Marcus Aurelius',
    participants: [
      { id: 'ext-1', name: 'Marcus Aurelius', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aurelius', role: 'External Advisor', orgId: EXTERNAL_ORG_ID, isOnline: true }
    ],
    lastMessage: {
      text: 'The architectural review is complete.',
      timestamp: '9:00 AM',
      senderName: 'Marcus Aurelius'
    },
    unreadCount: 1
  },
  {
    id: 'conv-3',
    type: ConversationType.GROUP,
    name: 'Core Engineering',
    participants: [
      { id: 'd4e4f4g4', name: 'David Miller', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', role: 'Infrastructure', orgId: MOCK_ORG_ID, isOnline: true },
      { id: 'b2c2d2e2', name: 'Marcus Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', role: 'Project Lead', orgId: MOCK_ORG_ID, isOnline: true }
    ],
    lastMessage: {
      text: 'Server maintenance scheduled for Saturday.',
      timestamp: '2d ago',
      senderName: 'David Miller'
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
