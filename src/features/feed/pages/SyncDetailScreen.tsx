import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FeedItem } from '../components/FeedItem';
import { FeedSkeleton } from '../components/FeedSkeleton';
import { usePost } from '../hooks/usePost';
import { ArrowLeft, MessageSquare, ShieldAlert } from 'lucide-react';
import './SyncDetailScreen.css';

import { motion } from 'framer-motion';

export const SyncDetailScreen: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = usePost(postId);

  const post = data?.data;

  return (
    <motion.div 
      className="sync-detail-view"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <div className="detail-container">
        <div className="detail-main">
          <header className="detail-header">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
              <span>Back to Feed</span>
            </button>
          </header>

          {isLoading && <FeedSkeleton />}

          {isError && (
            <div className="error-state-card">
              <ShieldAlert size={48} className="error-icon" />
              <h3>Sync Not Found</h3>
              <p>{(error as Error)?.message || "We couldn't retrieve this specific sync. It may have been archived or restricted."}</p>
              <button onClick={() => navigate('/')} className="primary-btn">
                Back to Hub
              </button>
            </div>
          )}

          {post && (
            <div className="focused-sync">
              <FeedItem post={post} />
              
              <div className="comments-placeholder-card">
                <div className="placeholder-header">
                  <MessageSquare size={18} />
                  <span>Discussion</span>
                </div>
                <p>Synchronization of comments is coming soon to your curated workspace.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
