import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FeedItem } from '../components/FeedItem/FeedItem';
import { FeedSkeleton } from '../components/FeedSkeleton/FeedSkeleton';
import { usePost } from '../hooks/usePost';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import './SyncDetailScreen.css';

import { motion } from 'framer-motion';
import { useScrollRestoration } from '../../../hooks/useScrollRestoration';
import { PostDiscussion } from '../components/sub/PostDiscussion/PostDiscussion';

export const SyncDetailScreen: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = usePost(postId);

  useScrollRestoration(!isLoading);

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
              <FeedItem post={post} hideComment={true} />
              
              <PostDiscussion postId={post.id} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
