import React from 'react';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { demoFeedItems } from '../../feed/data';
import { PostCategory } from '../../feed/types';
import { 
  Megaphone, 
  Search, 
  Bell 
} from 'lucide-react';
import './AnnouncementsPage.css';

export const AnnouncementsPage: React.FC = () => {
  const announcementPosts = demoFeedItems.filter(p => p.postCategory === PostCategory.ANNOUNCEMENT);

  return (
    <div className="announcements-page">
      <header className="announcements-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Megaphone size={24} color="var(--primary)" />
            <h2>Organization Updates</h2>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
            <button className="icon-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: '500' }}>
              <Search size={18} />
              <span>Search</span>
            </button>
            <button className="primary-btn compact" style={{ gap: '8px' }}>
              <Bell size={18} />
              <span>Notify Team</span>
            </button>
          </div>
        </div>
      </header>

      <div className="announcements-feed">
        {announcementPosts.map(post => (
          <AnnouncementCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

