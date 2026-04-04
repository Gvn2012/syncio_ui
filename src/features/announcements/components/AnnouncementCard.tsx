import React from 'react';
import { 
  Pin, 
  ArrowRight, 
  Info, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import type { Post as PostType } from '../../feed/types';
import '../pages/AnnouncementsPage.css';

interface AnnouncementCardProps {
  post: PostType;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ post }) => {
  const ann = post.announcement;
  if (!ann) return null;
  
  const author = post.author || { name: 'Unknown', avatar: '' };

  const getTypeIcon = () => {
    switch (ann.priority) {
      case 'URGENT':
      case 'HIGH': 
        return <AlertTriangle size={16} />;
      case 'NORMAL': 
        return <Info size={16} />;
      default: 
        return <CheckCircle2 size={16} />;
    }
  };

  return (
    <div className={`announcement-card ${ann.isPinned ? 'pinned' : ''}`}>
      <div className="announcement-card-header">
        <div className="announcement-meta">
          <div className="announcement-type" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {getTypeIcon()}
            <span>{ann.priority}</span>
          </div>
          <span className="announcement-date">{post.publishedAt}</span>
        </div>
        {ann.isPinned && (
          <div className="pinned-badge">
            <Pin size={16} fill="var(--primary)" />
            <span>Pinned</span>
          </div>
        )}
      </div>

      <h3 className="announcement-title">{post.content}</h3>
      <div className="announcement-content">
        {post.excerpt || post.content}
      </div>

      <div className="announcement-footer">
        <div className="announcement-author">
          <img src={author.avatar} alt={author.name} />
          <div className="announcement-author-info">
            <span>{author.name}</span>
          </div>
        </div>
        <div className="read-more">
          <span>View Details</span>
          <ArrowRight size={16} />
        </div>
      </div>
    </div>
  );
};

