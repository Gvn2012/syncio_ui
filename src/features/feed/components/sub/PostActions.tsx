import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface PostActionsProps {
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  viewerReaction?: string | null;
  sharedByViewer: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

export const PostActions: React.FC<PostActionsProps> = ({
  reactionCount,
  commentCount,
  shareCount,
  viewerReaction,
  sharedByViewer,
  onLike,
  onComment,
  onShare,
}) => {
  const isLiked = !!viewerReaction;

  return (
    <footer className="feed-actions">
      <button 
        className={`action-btn ${isLiked ? 'active' : ''}`} 
        onClick={onLike}
        aria-label={`Like (${reactionCount})`}
      >
        <Heart 
          size={18} 
          fill={isLiked ? 'var(--primary)' : 'none'} 
          className={isLiked ? 'animate-pulse' : ''}
        />
        <span>{reactionCount}</span>
      </button>
      
      <button 
        className="action-btn" 
        onClick={onComment}
        aria-label={`Comment (${commentCount})`}
      >
        <MessageCircle size={18} />
        <span>{commentCount}</span>
      </button>
      
      <button 
        className={`action-btn ${sharedByViewer ? 'active' : ''}`} 
        onClick={onShare}
        aria-label={`Share (${shareCount})`}
      >
        <Share2 size={18} />
        <span>{shareCount}</span>
      </button>
    </footer>
  );
};
