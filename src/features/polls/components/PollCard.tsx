import React, { useState } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  MoreHorizontal
} from 'lucide-react';
import '../pages/PollsPage.css';

import type { Post as PostType } from '../../feed/types';

interface PollCardProps {
  post: PostType;
}

export const PollCard: React.FC<PollCardProps> = ({ post: initialPost }) => {
  const poll = initialPost.poll;
  if (!poll) return null;

  const [votedId, setVotedId] = useState<string | null>(null);
  const [options, setOptions] = useState(poll.options);
  const [totalVotes, setTotalVotes] = useState(poll.totalVotes);
  const author = initialPost.author || { name: 'Unknown', avatar: '', role: 'Member' };
  const timestamp = initialPost.publishedAt;


  const handleVote = (optionId: string) => {
    if (votedId) return; // Prevent multiple voting for this demo
    
    setVotedId(optionId);
    setOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, voteCount: opt.voteCount + 1 } : opt
    ));
    setTotalVotes(prev => prev + 1);
  };


  return (
    <div className="poll-card">
      <div className="poll-card-header">
        <div className="poll-author">
          <img src={author.avatar} alt={author.name} />
          <div className="poll-author-info">
            <h4>{author.name}</h4>
            <span>{author.role} • {timestamp}</span>
          </div>
        </div>
        <button className="more-btn">
          <MoreHorizontal size={18} color="var(--text-sidebar)" />
        </button>
      </div>

      <div className="poll-question">
        {poll.question}
      </div>

      <div className="poll-options">
        {options.map((option) => {
          const percentage = totalVotes > 0 
            ? Math.round((option.voteCount / totalVotes) * 100) 
            : 0;

          
          return (
            <div 
              key={option.id} 
              className={`poll-option ${votedId === option.id ? 'voted' : ''}`}
              onClick={() => handleVote(option.id)}
            >
              <div 
                className="poll-result-bar" 
                style={{ width: `${votedId ? percentage : 0}%` }}
              />
              <div className="poll-option-content">
                <span>{option.text}</span>
                {votedId && <span>{percentage}%</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="poll-stats">
        <div className="vote-count">
          <BarChart3 size={14} style={{ marginRight: '6px' }} />
          <span>{totalVotes} total votes</span>
        </div>
        {votedId && (
          <div className="voted-badge" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} />
            <span>Voted</span>
          </div>
        )}
      </div>
    </div>
  );
};
