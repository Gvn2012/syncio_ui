import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, ChevronLeft } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CommentService } from '../../api/comment.service';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';
import { CommentSkeleton } from './CommentSkeleton';
import { showError } from '../../../../store/slices/uiSlice';
import { CommentStatus } from '../../types';
import type { Comment, CommentPagedResponse } from '../../types';
import type { RootState } from '../../../../store';
import './CommentModal.css';

interface CommentModalProps {
  postId: string | null;
  commentId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  postId,
  commentId,
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const isRepliesView = !!commentId;

  const rootInfiniteQuery = useInfiniteQuery({
    queryKey: ['post-comments', postId],
    queryFn: ({ pageParam = 0 }) => CommentService.getComments(postId!, pageParam as number),
    enabled: !!postId && isOpen && !commentId,
    getNextPageParam: (lastPage: any) => lastPage.data?.hasNext ? lastPage.data.page + 1 : undefined,
    initialPageParam: 0,
    staleTime: 30000,
  });

  const repliesInfiniteQuery = useInfiniteQuery({
    queryKey: ['comment-replies', postId, commentId],
    queryFn: ({ pageParam = 0 }) => CommentService.getReplies(postId!, commentId!, pageParam as number),
    enabled: !!postId && !!commentId && isOpen,
    getNextPageParam: (lastPage: any) => lastPage.data?.hasNext ? lastPage.data.page + 1 : undefined,
    initialPageParam: 0,
    staleTime: 30000,
  });

  const parentCommentQuery = useQuery({
    queryKey: ['comment-detail', postId, commentId],
    queryFn: () => CommentService.getComment(postId!, commentId!),
    enabled: !!postId && !!commentId && isOpen,
    staleTime: 60000,
  });

  const currentInfiniteQuery = isRepliesView ? repliesInfiniteQuery : rootInfiniteQuery;
  const { 
    data: infiniteData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = currentInfiniteQuery;

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isOpen]);

  const { userDetail } = useSelector((state: RootState) => state.user);
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => CommentService.addComment(postId!, content, commentId || undefined),
    onMutate: async (content) => {
      scrollToTop();
      const avatarUrl = userDetail?.userProfileResponse.userProfilePictureResponseList.find(p => p.primary)?.url || '';
      
      const newComment: Comment = {
        id: `temp-${Date.now()}`,
        postId: postId!,
        parentCommentId: commentId || null,
        userId: userDetail?.userResponse.id || '',
        content,
        reactionCount: 0,
        replyCount: 0,
        status: CommentStatus.VISIBLE,
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

      setOptimisticComments(prev => [newComment, ...prev]);
      return { newComment };
    },
    onSuccess: (res, _, context) => {
      if (res.success) {
        setOptimisticComments(prev => 
          prev.map(c => c.id === context.newComment.id ? res.data : c)
        );
        // Update the comment count in the feed list
        queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
          if (!old || !old.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data?.map((post: any) => 
                post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post
              )
            }))
          };
        });

        if (commentId) {
          queryClient.invalidateQueries({ queryKey: ['comment-replies', postId, commentId] });
          queryClient.invalidateQueries({ queryKey: ['comment-detail', postId, commentId] });
          
          // Update reply count in the current page list
          queryClient.setQueryData(['post-comments', postId], (old: any) => {
            if (!old || !old.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                data: {
                  ...page.data,
                  comments: page.data?.comments?.map((c: any) => 
                    c.id === commentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c
                  )
                }
              }))
            };
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
        }
      } else {
        setOptimisticComments(prev => prev.filter(c => c.id !== context.newComment.id));
      }
    },
    onError: (_, __, context: any) => {
      setOptimisticComments(prev => prev.filter(c => c.id !== context.newComment.id));
      dispatch(showError("Failed to post"));
    }
  });

  useEffect(() => {
    if (isOpen) {
      setOptimisticComments([]);
    }
  }, [isOpen, commentId]);

  const handleBack = () => {
    navigate(`/post/${postId}/comments`, { replace: true });
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const serverComments = infiniteData?.pages.flatMap(page => {
    return (page.data as CommentPagedResponse)?.comments || [];
  }) || [];

  const totalCount = isRepliesView 
    ? (parentCommentQuery.data?.data?.replyCount || 0)
    : (infiniteData?.pages[0]?.data as CommentPagedResponse)?.totalElements || 0;

  const mergedComments = [
    ...optimisticComments.filter(oc => oc.parentCommentId === (commentId || null)),
    ...serverComments.filter(sc => !optimisticComments.some(oc => oc.id === sc.id))
  ];

  const allComments = [...mergedComments].sort((a, b) => {
    if (!isRepliesView) {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="comment-overlay">
          <motion.div 
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div 
            className="comment-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <header className="modal-header">
              <div className="header-content">
                {isRepliesView && (
                  <button className="back-btn" onClick={handleBack}>
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div className="header-text">
                  <h2>{isRepliesView ? null : 'Comments'}</h2>
                  {!isRepliesView && <span className="total-count">{totalCount} {totalCount === 1 ? 'comment' : 'comments'}</span>}
                </div>
              </div>
              <button className="modal-close-btn" onClick={handleClose}>
                <X size={20} />
              </button>
            </header>

            <div className="modal-body-scrollable" ref={scrollContainerRef}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={commentId || 'root'}
                  initial={{ opacity: 0, x: isRepliesView ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRepliesView ? -20 : 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {isRepliesView && parentCommentQuery.data?.data && (
                    <div className="parent-comment-context">
                      <CommentItem 
                        comment={parentCommentQuery.data.data} 
                        postId={postId!} 
                        hideReplies={true}
                        hideReplyAction={true}
                      />
                      <div className="replies-separator">
                        <span>Replies</span>
                      </div>
                    </div>
                  )}

                  {isLoading ? (
                    <div className="comments-list">
                      {[...Array(5)].map((_, i) => <CommentSkeleton key={i} />)}
                    </div>
                  ) : allComments.length > 0 ? (
                    <div className="comments-list">
                      {allComments.map(comment => (
                        <CommentItem 
                          key={comment.id} 
                          comment={comment} 
                          postId={postId!}
                          onDelete={() => {
                            queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
                            queryClient.invalidateQueries({ queryKey: ['comment-replies', postId] });
                          }}
                          onUpdate={() => {
                            queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
                            queryClient.invalidateQueries({ queryKey: ['comment-replies', postId] });
                          }}
                        />
                      ))}
                      
                      {isFetchingNextPage && (
                        <div className="comments-list" style={{ marginTop: '20px' }}>
                          {[...Array(3)].map((_, i) => <CommentSkeleton key={i} />)}
                        </div>
                      )}
                      
                      <div ref={loadMoreRef} style={{ height: '20px', margin: '10px 0' }} />
                    </div>
                  ) : (
                    <div className="empty-comments">
                      <MessageSquare size={48} strokeWidth={1} />
                      <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="modal-footer">
              <CommentInput 
                placeholder={isRepliesView ? "Write a reply..." : "Write a comment..."}
                onSubmit={(content) => addCommentMutation.mutate(content)}
                isLoading={addCommentMutation.isPending}
              />
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
