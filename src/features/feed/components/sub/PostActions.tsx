import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MessageCircle, Share2 } from 'lucide-react';
import { getReactionIcon } from '../../utils/reactionUtils';
import { ReactionType } from '../../types';
import { ReactionPicker } from './ReactionPicker';
import type { RootState } from '../../../../store';

interface PostActionsProps {
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  viewerReaction?: string | null;
  sharedByViewer: boolean;
  onReaction?: (type: ReactionType) => void;
  onComment?: () => void;
  onShare?: () => void;
}

export const PostActions: React.FC<PostActionsProps> = ({
  reactionCount,
  commentCount,
  shareCount,
  viewerReaction,
  sharedByViewer,
  onReaction,
  onComment,
  onShare,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverDuration = useSelector((state: RootState) => state.preferences.reactionHoverDuration);
  
  const isReacted = !!viewerReaction;
  
  const handleReactionClick = () => {
    if (showPicker) return;

    const type = (viewerReaction as ReactionType) || ReactionType.LIKE;
    onReaction?.(type);
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPicker(true);
    }, hoverDuration);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPicker(false);
    }, 300);
  };

  const handleSelectReaction = (type: ReactionType) => {
    onReaction?.(type);
    setShowPicker(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <footer className="feed-actions" style={{ position: 'relative' }}>
      <div 
        className="reaction-wrapper"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <ReactionPicker 
          isVisible={showPicker}
          onSelect={handleSelectReaction}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            setShowPicker(true);
          }}
          onMouseLeave={handleMouseLeave}
        />
        
        <button 
          className={`action-btn ${isReacted ? 'active' : ''}`} 
          onClick={handleReactionClick}
          aria-label={`React (${reactionCount})`}
        >
          {getReactionIcon(viewerReaction || ReactionType.LIKE, isReacted)}
          <span className="action-label" aria-hidden="true">Like</span>
          <span style={{ 
            color: isReacted ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: isReacted ? 600 : 400
          }}>
            {reactionCount}
          </span>
        </button>
      </div>
      
      <button 
        className="action-btn" 
        onClick={onComment}
        aria-label={`Comment (${commentCount})`}
      >
        <MessageCircle size={18} />
        <span className="action-label" aria-hidden="true">Comment</span>
        <span>{commentCount}</span>
      </button>
      
      <button 
        className={`action-btn ${sharedByViewer ? 'active' : ''}`} 
        onClick={onShare}
        aria-label={`Share (${shareCount})`}
      >
        <Share2 size={18} />
        <span className="action-label" aria-hidden="true">Share</span>
        <span>{shareCount}</span>
      </button>

    </footer>
  );
};
