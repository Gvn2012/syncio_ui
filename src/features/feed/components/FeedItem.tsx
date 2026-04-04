import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  CheckSquare, 
  Calendar,
  Sparkles,
  BarChart3,
  Megaphone
} from 'lucide-react';
import { PostCategory, TaskStatus } from '../types';
import type { Post as PostType } from '../types';
import { useFormatDate } from '../../../common/hooks/useFormatDate';
import './FeedItem.css';

interface FeedItemProps {
  post: PostType;
}

export const FeedItem: React.FC<FeedItemProps> = ({ post }) => {
  const isTask = post.postCategory === PostCategory.TASK;
  const isPoll = post.postCategory === PostCategory.POLL;
  const isAnnouncement = post.postCategory === PostCategory.ANNOUNCEMENT;
  const { format } = useFormatDate();

  const author = post.author || { name: 'Unknown', avatar: '', role: 'Member' };
  const imageAttachment = post.attachments?.find(a => a.type === 'IMAGE');

  return (
    <article className="feed-item">
      {post.isPinned && (
        <div className="curated-badge pinned">
          <Sparkles size={12} />
          <span>Pinned Update</span>
        </div>
      )}

      {isAnnouncement && (
        <div className="curated-badge announcement">
          <Megaphone size={12} />
          <span>Official Announcement</span>
        </div>
      )}

      <header className="feed-item-header">
        <div className="author-info">
          <img src={author.avatar} alt={author.name} className="author-avatar" />
          <div className="author-details">
            <h4>{author.name}</h4>
            <p>{author.role || 'Member'}</p>
          </div>
        </div>
        <div className="item-meta">
          <span className="timestamp">{post.publishedAt}</span>
          <button className="more-btn">
            <MoreHorizontal size={18} color="var(--text-sidebar)" />
          </button>
        </div>
      </header>

      <div className="feed-content">
        <p>{post.content}</p>
        
        {imageAttachment && (
          <img src={imageAttachment.url} alt="Post content" className="feed-image" />
        )}

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

      <footer className="feed-actions">
        <button className={`action-btn ${post.isLiked ? 'active' : ''}`}>
          <Heart size={18} fill={post.isLiked ? 'var(--primary)' : 'none'} />
          <span>{post.likes}</span>
        </button>
        <button className="action-btn">
          <MessageCircle size={18} />
          <span>{post.comments}</span>
        </button>
        <button className="action-btn">
          <Share2 size={18} />
          <span>{post.shareCount}</span>
        </button>
      </footer>
    </article>
  );
};

