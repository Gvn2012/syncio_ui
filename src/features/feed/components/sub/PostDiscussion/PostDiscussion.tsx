import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronLeft, Loader2 } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { CommentService } from '../../../api/comment.service';
import { CommentItem } from '../CommentItem/CommentItem';
import { CommentInput } from '../CommentInput/CommentInput';
import { CommentSkeleton } from '../CommentSkeleton/CommentSkeleton';
import { showError } from '../../../../../store/slices/uiSlice';
import { CommentStatus } from '../../../types';
import type { Comment, CommentPagedResponse } from '../../../types';
import type { RootState } from '../../../../../store';
import './PostDiscussion.css';

interface PostDiscussionProps {
  postId: string;
}

export const PostDiscussion: React.FC<PostDiscussionProps> = ({ postId }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isRepliesView = !!activeCommentId;

  const rootInfiniteQuery = useInfiniteQuery({
    queryKey: ['post-comments', postId],
    queryFn: ({ pageParam = 0 }) => CommentService.getComments(postId, pageParam as number),
    enabled: !!postId && !activeCommentId,
    getNextPageParam: (lastPage: any) => lastPage.data?.hasNext ? lastPage.data.page + 1 : undefined,
    initialPageParam: 0,
    staleTime: 30000,
  });

  const repliesInfiniteQuery = useInfiniteQuery({
    queryKey: ['comment-replies', postId, activeCommentId],
    queryFn: ({ pageParam = 0 }) => CommentService.getReplies(postId, activeCommentId!, pageParam as number),
    enabled: !!postId && !!activeCommentId,
    getNextPageParam: (lastPage: any) => lastPage.data?.hasNext ? lastPage.data.page + 1 : undefined,
    initialPageParam: 0,
    staleTime: 30000,
  });

  const parentCommentQuery = useQuery({
    queryKey: ['comment-detail', postId, activeCommentId],
    queryFn: () => CommentService.getComment(postId, activeCommentId!),
    enabled: !!postId && !!activeCommentId,
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
    if (!hasNextPage || isFetchingNextPage) return;

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { userDetail } = useSelector((state: RootState) => state.user);
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => CommentService.addComment(postId, content, activeCommentId || undefined),
    onMutate: async (content) => {
      const avatarUrl = userDetail?.userProfileResponse?.userProfilePictureResponseList?.find(p => p.primary)?.url || '';
      
      const newComment: Comment = {
        id: `temp-${Date.now()}`,
        postId: postId,
        parentCommentId: activeCommentId || null,
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
        
        // Update counts in cache
        if (activeCommentId) {
          queryClient.invalidateQueries({ queryKey: ['comment-replies', postId, activeCommentId] });
          queryClient.invalidateQueries({ queryKey: ['comment-detail', postId, activeCommentId] });
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

  const serverComments = infiniteData?.pages.flatMap(page => {
    return (page.data as CommentPagedResponse)?.comments || [];
  }) || [];

  const mergedComments = [
    ...optimisticComments.filter(oc => oc.parentCommentId === (activeCommentId || null)),
    ...serverComments.filter(sc => !optimisticComments.some(oc => oc.id === sc.id))
  ];

  const allComments = [...mergedComments].sort((a, b) => {
    if (!isRepliesView) {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="post-discussion-card" ref={scrollRef}>
      <header className="discussion-header">
        <div className="header-left">
          {isRepliesView && (
            <button className="back-to-comments" onClick={() => setActiveCommentId(null)}>
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="header-title-group">
            <MessageSquare size={18} className="discussion-icon" />
            <h3>{isRepliesView ? 'Replies' : 'Discussion'}</h3>
          </div>
        </div>
        {!isRepliesView && allComments.length > 0 && (
          <span className="comment-count-pill">{allComments.length} Comments</span>
        )}
      </header>

      <div className="discussion-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCommentId || 'root'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {isRepliesView && parentCommentQuery.data?.data && (
              <div className="replies-context">
                <CommentItem 
                  comment={parentCommentQuery.data.data} 
                  postId={postId} 
                  hideReplies={true}
                  hideReplyAction={true}
                />
                <div className="replies-divider">
                  <span>Discussion Stream</span>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="discussion-loading">
                {[...Array(3)].map((_, i) => <CommentSkeleton key={i} />)}
              </div>
            ) : allComments.length > 0 ? (
              <div className="comments-stack">
                {allComments.map(comment => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    postId={postId}
                    onViewReplies={(id) => setActiveCommentId(id)}
                    onDelete={(id) => {
                        // Optimistic UI for deletion
                        queryClient.setQueryData(['post-comments', postId], (old: any) => {
                            if (!old || !old.pages) return old;
                            return {
                                ...old,
                                pages: old.pages.map((page: any) => ({
                                    ...page,
                                    data: {
                                        ...page.data,
                                        comments: page.data?.comments?.filter((c: any) => c.id !== id)
                                    }
                                }))
                            };
                        });
                        
                        if (activeCommentId) {
                           queryClient.setQueryData(['comment-replies', postId, activeCommentId], (old: any) => {
                               if (!old || !old.pages) return old;
                               return {
                                   ...old,
                                   pages: old.pages.map((page: any) => ({
                                       ...page,
                                       data: {
                                           ...page.data,
                                           comments: page.data?.comments?.filter((c: any) => c.id !== id)
                                       }
                                   }))
                               };
                           });
                        }
                        
                        queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
                        if (activeCommentId) {
                           queryClient.invalidateQueries({ queryKey: ['comment-replies', postId, activeCommentId] });
                        }
                    }}
                  />
                ))}
                
                {isFetchingNextPage && <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>}
                <div ref={loadMoreRef} className="h-4" />
              </div>
            ) : (
              <div className="no-comments-state">
                <p>Start the conversation. Be the first to synchronize your thoughts!</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="discussion-footer">
        <CommentInput 
          placeholder={isRepliesView ? "Write a reply..." : "Add to the discussion..."}
          onSubmit={(content) => addCommentMutation.mutate(content)}
          isLoading={addCommentMutation.isPending}
        />
      </footer>
    </div>
  );
};
