import { PostCategory } from '../types';
import { PostPriority, type PostCreateRequest } from '../types/post-request.types';

export const MAX_FILES = 10;
export const MAX_SIZE_MB = 10;
export const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const MOCK_USERS = [
  { id: 'u2', name: 'Marcus Chen', role: 'Product Manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' },
  { id: 'u3', name: 'Elena Vance', role: 'Designer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena' },
  { id: 'u4', name: 'Sarah Jenkins', role: 'Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'u5', name: 'David Smith', role: 'DevOps', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
  { id: 'u6', name: 'Lisa Ray', role: 'Marketing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' },
  { id: 'u7', name: 'Tom Hardy', role: 'Manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom' },
];

export const getDefaultCategoryData = (cat: PostCategory) => {
  const base = {
    priority: PostPriority.MEDIUM,
  };

  switch(cat) {
    case PostCategory.POLL:
      return { ...base, question: '', options: ['', ''], allowMultipleAnswers: false, maxOptionsSelected: 1, expiresAt: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16) };
    case PostCategory.TASK:
      return { ...base, title: '', description: '', dueAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16) };
    case PostCategory.EVENT:
      return { ...base, title: '', description: '', location: '', startTime: new Date(Date.now() + 3600000 * 2).toISOString().slice(0, 16), endTime: new Date(Date.now() + 3600000 * 4).toISOString().slice(0, 16), isVirtual: false, maxParticipants: undefined };
    case PostCategory.ANNOUNCEMENT:
      return { ...base, isPinned: true, pinnedUntil: new Date(Date.now() + 86400000).toISOString().slice(0, 16), requiresAcknowledgement: false };
    default:
      return base;
  }
};

export const CATEGORY_MAPPERS: Partial<Record<PostCategory, (data: any, taggedIds: string[]) => Partial<PostCreateRequest>>> = {
  [PostCategory.EVENT]: (data) => ({
    event: {
      title: data.title,
      description: data.description,
      location: data.location,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      isVirtual: data.isVirtual,
      joinUrl: data.joinUrl,
      maxParticipants: data.maxParticipants
    }
  }),
  [PostCategory.POLL]: (data) => ({
    poll: {
      question: data.question,
      allowMultipleAnswers: data.allowMultipleAnswers,
      maxOptionsSelected: data.maxOptionsSelected,
      expiresAt: new Date(data.expiresAt).toISOString(),
      options: (data.options || []).map((opt: string, i: number) => ({
        optionText: opt,
        position: i + 1
      }))
    }
  }),
  [PostCategory.TASK]: (data, taggedIds) => ({
    task: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueAt: new Date(data.dueAt).toISOString(),
      assignees: taggedIds
    }
  }),
  [PostCategory.ANNOUNCEMENT]: (data) => ({
    announcement: {
      priority: data.priority,
      isPinned: data.isPinned,
      pinnedUntil: data.isPinned ? new Date(data.pinnedUntil).toISOString() : undefined,
      requiresAcknowledgement: data.requiresAcknowledgement
    }
  })
};
