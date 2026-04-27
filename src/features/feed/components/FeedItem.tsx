import React from 'react';
import { 
  CheckSquare, 
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../store/slices/uiSlice';
import { PostCategory, TaskStatus } from '../types';
import type { Post as PostType } from '../types';
import { useFormatDate } from '../../../common/hooks/useFormatDate';
import { PostHeader } from './sub/PostHeader';
import { PostContent } from './sub/PostContent';
import { MediaGallery } from './sub/MediaGallery';
import { PostActions } from './sub/PostActions';
import { PostReactionsSummary } from './sub/PostReactionsSummary';
import './FeedItem.css';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { useReaction } from '../hooks/useReaction';

interface FeedItemProps {
  post: PostType;
}

export const FeedItem: React.FC<FeedItemProps> = React.memo(({ post }) => {
  const navigate = useNavigate();
  const isTask = post.postCategory === PostCategory.TASK;
  const isPoll = post.postCategory === PostCategory.POLL;
  const { format } = useFormatDate();
  const dispatch = useDispatch();
  const { mutate: toggleReaction } = useReaction(post.id);
  const [, setSearchParams] = useSearchParams();

  const handleOpenReactions = () => {
    dispatch(openModal({ type: 'REACTIONS', data: { postId: post.id } }));
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('reactions', post.id);
      return newParams;
    }, { replace: true });
  };

  const handleOpenComments = () => {
    navigate(`/post/${post.id}/comments`, { replace: true });
  };

  const handleNavigate = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('.poll-option') || 
      target.closest('.task-badge')
    ) {
      return;
    }
    navigate(`/sync/${post.id}`);
  };

  return (
    <article className="feed-item">
      <div className="clickable-content" onClick={handleNavigate}>
        <PostHeader 
          author={post.authorInfo}
          publishedAt={post.publishedAt}
          isPinned={post.isPinned}
          isAnnouncement={post.postCategory === PostCategory.ANNOUNCEMENT}
        />

        <div className="feed-body">
          <PostContent 
            content={post.content}
            contentHtml={post.contentHtml}
            mentions={post.mentions}
            tags={post.tags}
          />
        </div>
      </div>
        
      <MediaGallery attachments={post.attachments} />

      {(isTask || isPoll || (post.attachments && post.attachments.length > 0)) && (
        <div className="feed-polymorphic-content">
          {isTask && post.task && (
            <div className="task-preview">
              <div className={`task-badge ${post.task.status === TaskStatus.COMPLETED ? 'completed' : ''}`}>
                <CheckSquare size={14} />
                <span>{post.task.status}</span>
              </div>
              {post.task.dueAt && (
                <div className="task-deadline">
                  <Calendar size={14} />
                  <span>Due: {format(post.task.dueAt)}</span>
                </div>
              )}
            </div>
          )}

          {isPoll && post.poll && (
            <div className="poll-options">
              <div className="poll-question-mini">
                <BarChart3 size={14} />
                <span>{post.poll.question}</span>
              </div>
              {post.poll.options.map((option) => (
                <div key={option.id} className="poll-option">
                  <div 
                    className="poll-bg" 
                    style={{ width: `${post.poll!.totalVotes > 0 ? (option.voteCount / post.poll!.totalVotes) * 100 : 0}%` }}
                  />
                  <div className="poll-text">
                    <span>{option.text}</span>
                    <span>{post.poll!.totalVotes > 0 ? Math.round((option.voteCount / post.poll!.totalVotes) * 100) : 0}%</span>
                  </div>
                </div>
              ))}
              <div className="total-votes">
                {post.poll.totalVotes} votes total
              </div>
            </div>
          )}
        </div>
      )}

      <PostReactionsSummary 
        topReactions={post.topReactions || []}
        totalCount={post.reactionCount}
        onClick={handleOpenReactions}
      />

      <PostActions 
        reactionCount={post.reactionCount}
        commentCount={post.commentCount}
        shareCount={post.shareCount}
        viewerReaction={post.viewerReaction}
        sharedByViewer={post.sharedByViewer}
        onReaction={(type) => toggleReaction(type)}
        onComment={handleOpenComments}
      />
    </article>
  );
});
