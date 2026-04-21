import React from 'react';
import { MoreHorizontal, Sparkles, Megaphone } from 'lucide-react';
import { UserAvatar } from '../../../../components/UserAvatar';
import { useFormatDate } from '../../../../common/hooks/useFormatDate';
import type { AuthorInfo } from '../../types';

interface PostHeaderProps {
  author?: AuthorInfo;
  publishedAt: string;
  isPinned?: boolean;
  isAnnouncement?: boolean;
}

export const PostHeader: React.FC<PostHeaderProps> = ({ 
  author, 
  publishedAt, 
  isPinned, 
  isAnnouncement 
}) => {
  const { formatRelative } = useFormatDate();

  return (
    <header className="feed-item-header">
      <div className="author-info">
        <UserAvatar 
          userId={author?.userId} 
          src={author?.avatarUrl} 
          className="author-avatar" 
          size={40} 
        />
        <div className="author-details">
          <div className="name-row">
            <h4>{author?.displayName || 'Unknown Author'}</h4>
            {isPinned && (
              <span className="pinned-indicator">
                <Sparkles size={10} />
              </span>
            )}
          </div>
          <p className="author-role">{author?.role || 'Member'}</p>
        </div>
      </div>
      
      <div className="item-meta">
        <div className="meta-info">
          <span className="timestamp">{formatRelative(publishedAt)}</span>
          {isAnnouncement && (
            <span className="announcement-tag">
              <Megaphone size={10} />
              Official
            </span>
          )}
        </div>
        <button className="more-btn" aria-label="More options">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </header>
  );
};
