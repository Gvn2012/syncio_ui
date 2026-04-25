import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleReaction } from '../api/feedApi';
import { ReactionType } from '../types';
import type { Post } from '../types';

export const useReaction = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (type: ReactionType) => toggleReaction(postId, type),
    onMutate: async (type) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      const previousFeed = queryClient.getQueryData(['feed']);
      const previousPost = queryClient.getQueryData(['post', postId]);

      queryClient.setQueryData(['feed'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((post: Post) => {
              if (post.id === postId) {
                const isSameReaction = post.viewerReaction === type;
                const hasAnyReaction = !!post.viewerReaction;
                
                let newReactionCount = post.reactionCount;
                let newViewerReaction = type;
                let newTopReactions = [...(post.topReactions || [])];

                if (isSameReaction) {
                  newReactionCount -= 1;
                  newViewerReaction = null as any;
                 
                  newTopReactions = newTopReactions.filter(t => t !== type);
                } else {
                  if (!hasAnyReaction) {
                    newReactionCount += 1;
                  }
                  if (hasAnyReaction) {
                    newTopReactions = newTopReactions.filter(t => t !== post.viewerReaction);
                  }
                
                  if (!newTopReactions.includes(type)) {
                    newTopReactions = [type, ...newTopReactions].slice(0, 3);
                  }
                }

                return {
                  ...post,
                  viewerReaction: newViewerReaction,
                  reactionCount: newReactionCount,
                  topReactions: newTopReactions
                };
              }
              return post;
            })
          }))
        };
      });

      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) return old;
        const isSameReaction = old.data.viewerReaction === type;
        const hasAnyReaction = !!old.data.viewerReaction;

        let newReactionCount = old.data.reactionCount;
        let newViewerReaction = type;
        let newTopReactions = [...(old.data.topReactions || [])];

        if (isSameReaction) {
          newReactionCount -= 1;
          newViewerReaction = null as any;
          newTopReactions = newTopReactions.filter(t => t !== type);
        } else {
          if (!hasAnyReaction) {
            newReactionCount += 1;
          }
          if (hasAnyReaction) {
            newTopReactions = newTopReactions.filter(t => t !== old.data.viewerReaction);
          }
          if (!newTopReactions.includes(type)) {
            newTopReactions = [type, ...newTopReactions].slice(0, 3);
          }
        }

        return {
          ...old,
          data: {
            ...old.data,
            viewerReaction: newViewerReaction,
            reactionCount: newReactionCount,
            topReactions: newTopReactions
          }
        };
      });

      return { previousFeed, previousPost };
    },
    onError: (_err, _type, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed'], context.previousFeed);
      }
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
    },
    onSettled: () => {

      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
};
