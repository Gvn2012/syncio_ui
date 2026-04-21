import React from 'react';
import { PollCard } from '../components/PollCard';
import { demoFeedItems } from '../../feed/data';
import { PostCategory } from '../../feed/types';
import { Plus } from 'lucide-react';
import './PollsPage.css';

export const PollsPage: React.FC = () => {
  const pollPosts = demoFeedItems.filter(p => p.postCategory === PostCategory.POLL);

  return (
    <div className="polls-page">
      <header className="polls-header">
        <h2>Active Polls</h2>
        <button className="primary-btn compact" style={{ gap: '8px' }}>
          <Plus size={18} />
          <span>Create Poll</span>
        </button>
      </header>

      <div className="polls-grid">
        {pollPosts.map(post => (
          <PollCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

