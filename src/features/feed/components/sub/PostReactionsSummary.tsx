import React from 'react';
import { ReactionType } from '../../types';
import { REACTION_CONFIG } from '../../utils/reactionUtils';
import './PostReactionsSummary.css';

interface PostReactionsSummaryProps {
  topReactions: ReactionType[];
  totalCount: number;
  onClick?: () => void;
}

export const PostReactionsSummary: React.FC<PostReactionsSummaryProps> = ({
  topReactions,
  totalCount,
  onClick,
}) => {
  if (totalCount === 0 || !topReactions || topReactions.length === 0) return null;

  return (
    <div className="post-reactions-summary" onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}>
      <div className="reaction-icons-stack">
        {topReactions.slice(0, 3).map((type, index) => {
          const config = REACTION_CONFIG[type];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <div 
              key={type} 
              className="summary-icon-wrapper" 
              style={{ 
                zIndex: 3 - index,
                backgroundColor: config.color,
                marginLeft: index === 0 ? 0 : -6
              }}
              title={config.label}
            >
              <Icon size={10} color="white" fill="white" strokeWidth={3} />
            </div>
          );
        })}
      </div>
      <span className="reaction-total-count">{totalCount} {totalCount === 1 ? 'reaction' : 'reactions'}</span>
    </div>
  );
};
