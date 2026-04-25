import { ThumbsUp, ThumbsDown, Heart, Angry, Frown, type LucideIcon } from 'lucide-react';
  import { ReactionType } from '../types';

export interface ReactionConfig {
  icon: LucideIcon;
  color: string;
  label: string;
}

export const REACTION_CONFIG: Record<ReactionType, ReactionConfig> = {
  [ReactionType.LIKE]: {
    icon: ThumbsUp,
    color: '#3b82f6',
    label: 'Like',
  },
  [ReactionType.DISLIKE]: {
    icon: ThumbsDown,
    color: '#64748b',
    label: 'Dislike',
  },
  [ReactionType.LOVE]: {
    icon: Heart,
    color: '#ef4444',
    label: 'Love',
  },
  [ReactionType.ANGRY]: {
    icon: Angry,
    color: '#f97316',
    label: 'Angry',
  },
  [ReactionType.SAD]: {
    icon: Frown,
    color: '#eab308',
    label: 'Sad',
  },
};

export const getReactionIcon = (type: string | ReactionType | null | undefined, active: boolean = false) => {
  if (!type) return null;
  
  const reactionType = typeof type === 'string' ? type as ReactionType : type;
  const config = REACTION_CONFIG[reactionType];
  
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <Icon 
      size={20} 
      style={{ 
        color: active ? config.color : 'var(--text-muted)',
        fill: active ? (reactionType === ReactionType.LOVE ? config.color : 'transparent') : 'transparent',
        transition: 'all var(--transition-speed) var(--transition-bezier)'
      }} 
    />
  );
};

export const getReactionColor = (type: ReactionType | string | null | undefined): string => {
  if (!type) return 'var(--text-muted)';
  const reactionType = typeof type === 'string' ? type as ReactionType : type;
  return REACTION_CONFIG[reactionType]?.color || 'var(--text-muted)';
};

export const getReactionLabel = (type: ReactionType | string | null | undefined): string => {
  if (!type) return '';
  const reactionType = typeof type === 'string' ? type as ReactionType : type;
  return REACTION_CONFIG[reactionType]?.label || '';
};
