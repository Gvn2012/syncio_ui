import React, { useState } from 'react';
import { 
  Heart, 
  MoreHorizontal, 
  Pin, 
  Trash2, 
  Edit3,
  ChevronDown
} from 'lucide-react';
import { useFormatDate } from '../../../../common/hooks/useFormatDate';
import { UserAvatar } from '../../../../components/UserAvatar';
import type { Comment } from '../../types';
import { ReactionType } from '../../types';
import { CommentInput } from './CommentInput';
import { CommentService } from '../../api/comment.service';
import { useDispatch, useSelector } from 'react-redux';
import { showError, showSuccess } from '../../../../store/slices/uiSlice';
import type { RootState } from '../../../../store';
import { useNavigate } from 'react-router-dom';
import './CommentItem.css';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onDelete?: (id: string) => void;
  onUpdate?: (comment: Comment) => void;
  hideReplies?: boolean;
  hideReplyAction?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  postId,
  onDelete,
  onUpdate,
  hideReplies = false,
  hideReplyAction = false
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formatRelative } = useFormatDate();
  const { userDetail } = useSelector((state: RootState) => state.user);
  const currentUserId = userDetail?.userResponse.id;
  
  const [isReplying, setIsReplying] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [localReplyCount, setLocalReplyCount] = useState(comment.replyCount);
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isOptimistic = comment.id.startsWith('temp-');

 
  React.useEffect(() => {
    if (comment.replyCount > localReplyCount) {
      setLocalReplyCount(comment.replyCount);
    }
  }, [comment.replyCount, localReplyCount]);
  
  const isAuthor = comment.userId === currentUserId;
  const isPinned = comment.isPinned;

  const handleAddReply = async (content: string) => {
    const avatarUrl = userDetail?.userProfileResponse.userProfilePictureResponseList.find(p => p.primary)?.url || '';
    
    const tempReply: Comment = {
      id: `temp-${Date.now()}`,
      postId,
      parentCommentId: comment.id,
      userId: userDetail?.userResponse.id || '',
      content,
      reactionCount: 0,
      replyCount: 0,
      status: comment.status,
      isPinned: false,
      isEdited: false,
      createdAt: new Date().toISOString(),
      authorInfo: {
        id: userDetail?.userResponse.id || '',
        username: userDetail?.userResponse.username || 'You',
        avatar: avatarUrl,
        active: true
      },
      viewerReaction: null
    };

    setReplies(prev => [tempReply, ...prev]);
    setLocalReplyCount(prev => prev + 1);
    setIsReplying(false);

    try {
      const res = await CommentService.addComment(postId, content, comment.id);
      if (res.success) {
        setReplies(prev => prev.map(r => r.id === tempReply.id ? res.data : r));
        dispatch(showSuccess("Reply added"));
      } else {
        setReplies(prev => prev.filter(r => r.id !== tempReply.id));
        setLocalReplyCount(prev => prev - 1);
        dispatch(showError("Failed to add reply"));
      }
    } catch (err) {
      setReplies(prev => prev.filter(r => r.id !== tempReply.id));
      setLocalReplyCount(prev => prev - 1);
      dispatch(showError("Failed to add reply"));
    }
  };

  const handleUpdate = async (content: string) => {
    try {
      const res = await CommentService.updateComment(postId, comment.id, content);
      if (res.success) {
        onUpdate?.(res.data);
        setIsEditing(false);
        dispatch(showSuccess("Comment updated"));
      }
    } catch (err) {
      dispatch(showError("Failed to update comment"));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this comment? All replies will also be deleted.")) return;
    try {
      const res = await CommentService.deleteComment(postId, comment.id);
      if (res.success) {
        onDelete?.(comment.id);
        dispatch(showSuccess("Comment deleted"));
      }
    } catch (err) {
      dispatch(showError("Failed to delete comment"));
    }
  };

  const handleTogglePin = async () => {
    try {
      const res = await CommentService.togglePin(postId, comment.id);
      if (res.success) {
        dispatch(showSuccess(isPinned ? "Comment unpinned" : "Comment pinned"));
        onUpdate?.({ ...comment, isPinned: !isPinned });
      }
    } catch (err) {
      dispatch(showError("Failed to pin comment"));
    }
  };

  return (
    <div className={`comment-item-root ${isPinned ? 'pinned' : ''} ${isOptimistic ? 'is-optimistic' : ''}`}>
      <div className="comment-main-container">
        <UserAvatar 
          userId={comment.userId} 
          src={comment.authorInfo.avatar} 
          size={36} 
          className="comment-avatar"
        />
        
        <div className="comment-content-wrapper">
          <div className="comment-bubble">
            <div className="comment-header">
              <div className="author-meta">
                <span className="author-name">{comment.authorInfo.username}</span>
                {isPinned && <Pin size={12} className="pin-icon" fill="currentColor" />}
                <span className="comment-date">
                  {formatRelative(comment.createdAt)}
                </span>
                {comment.isEdited && <span className="edited-tag">(edited)</span>}
              </div>
              
              {!isOptimistic && (
                <div className="comment-actions-trigger">
                  <button 
                    className="menu-btn" 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  
                  {isMenuOpen && (
                    <div className="comment-menu">
                      {isAuthor && (
                        <>
                          <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}>
                            <Edit3 size={14} /> Edit
                          </button>
                          <button onClick={() => { handleTogglePin(); setIsMenuOpen(false); }}>
                            <Pin size={14} /> {isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button className="delete-action" onClick={handleDelete}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </>
                      )}
                      {!isAuthor && (
                         <button onClick={() => setIsMenuOpen(false)}>Report</button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <CommentInput 
                autoFocus 
                placeholder="Edit your comment..." 
                onSubmit={handleUpdate}
                onCancel={() => setIsEditing(false)}
                isReply
              />
            ) : (
              <p className="comment-text">{comment.content}</p>
            )}
          </div>

          <div className="comment-footer">
            <button 
              className={`engagement-btn ${comment.viewerReaction === ReactionType.LIKE ? 'active' : ''}`}
              disabled={isOptimistic}
            >
              <Heart size={14} fill={comment.viewerReaction === ReactionType.LIKE ? "currentColor" : "none"} />
              <span>{comment.reactionCount}</span>
            </button>
            {!hideReplyAction && (
              <button 
                className="engagement-btn" 
                onClick={() => setIsReplying(!isReplying)}
                disabled={isOptimistic}
              >
                <span>Reply</span>
              </button>
            )}

            {!hideReplies && (localReplyCount > 0 || replies.length > 0) && (
              <button 
                className="engagement-btn replies-btn" 
                onClick={() => navigate(`/post/${postId}/comments/${comment.id}/replies`, { replace: true })}
                disabled={isOptimistic}
              >
                <ChevronDown size={14} />
                <span>
                  {`View replies (${localReplyCount})`}
                </span>
              </button>
            )}
          </div>

          {isReplying && (
            <div className="reply-input-wrapper">
              <CommentInput 
                autoFocus 
                isReply 
                placeholder={`Reply to ${comment.authorInfo.username}...`}
                onSubmit={handleAddReply}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
