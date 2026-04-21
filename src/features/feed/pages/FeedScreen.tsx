import React, { useEffect } from 'react';
import { FeedItem } from '../components/FeedItem';
import { FeedSkeleton } from '../components/FeedSkeleton';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed';
import { useIntersection } from '../../../hooks/useIntersection';
import { Plus, Filter, ArrowUpDown, Search, Loader2 } from 'lucide-react';
import './FeedScreen.css';
import { Link } from 'react-router-dom';

export const FeedScreen: React.FC = () => {
  const { 
    posts, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage, 
    isError,
    isEmpty 
  } = useInfiniteFeed(10);

  const { elementRef, isIntersecting } = useIntersection({
    rootMargin: '200px',
    threshold: 0.1
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="feed-view">
      <header className="feed-header-bar">
        <div className="header-title">
          <h2>Sync Feed</h2>
          <span className="count-badge">
            {isLoading ? '...' : posts.length} Syncs
          </span>
        </div>
        
        <div className="header-actions">
          <div className="search-pill">
            <Search size={16} />
            <input type="text" placeholder="Filter syncs..." />
          </div>
          <button className="action-btn">
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <button className="action-btn">
            <ArrowUpDown size={18} />
            <span>Sort</span>
          </button>
          <Link to="/create-post" className="create-sync-btn-link">
            <button className="create-sync-btn">
              <Plus size={18} />
              <span>Create Sync</span>
            </button>
          </Link>
        </div>
      </header>
      
      <div className="feed-container">
        <div className="feed-main">
          {isLoading && (
            <>
              <FeedSkeleton />
              <FeedSkeleton />
              <FeedSkeleton />
            </>
          )}

          {isError && (
            <div className="feed-error-state">
              <p>Failed to synchronize feed. Check your connection.</p>
              <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
            </div>
          )}

          {!isLoading && isEmpty && (
            <div className="feed-empty-state">
              <p>No syncs found. Start by following someone or creating a new post!</p>
            </div>
          )}

          {posts.map((post) => (
            <FeedItem key={post.id} post={post} />
          ))}

          {hasNextPage && (
            <div ref={elementRef} className="loading-trigger">
              {isFetchingNextPage && <Loader2 className="animate-spin text-primary" size={24} />}
            </div>
          )}

          {!hasNextPage && !isEmpty && posts.length > 0 && (
            <div className="feed-end-message">
              <div className="end-dot" />
              <span>You're all caught up with the latest syncs</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
