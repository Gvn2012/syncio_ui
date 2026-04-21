import React from 'react';
import './FeedSkeleton.css';

export const FeedSkeleton: React.FC = () => {
  return (
    <div className="feed-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-avatar" />
        <div className="skeleton-meta">
          <div className="skeleton-line short" />
          <div className="skeleton-line x-short" />
        </div>
      </div>
      <div className="skeleton-body">
        <div className="skeleton-line long" />
        <div className="skeleton-line long" />
        <div className="skeleton-line medium" />
      </div>
      <div className="skeleton-media" />
      <div className="skeleton-footer">
        <div className="skeleton-chip" />
        <div className="skeleton-chip" />
        <div className="skeleton-chip" />
      </div>
    </div>
  );
};
