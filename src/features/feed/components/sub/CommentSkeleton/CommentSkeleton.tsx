import React from 'react';
import './CommentSkeleton.css';

export const CommentSkeleton: React.FC = () => {
  return (
    <div className="comment-skeleton-root">
      <div className="skeleton-avatar" />
      <div className="skeleton-content-wrapper">
        <div className="skeleton-bubble">
          <div className="skeleton-header">
            <div className="skeleton-name" />
            <div className="skeleton-date" />
          </div>
          <div className="skeleton-text" />
          <div className="skeleton-text short" />
        </div>
        <div className="skeleton-footer">
          <div className="skeleton-action" />
          <div className="skeleton-action" />
        </div>
      </div>
    </div>
  );
};
