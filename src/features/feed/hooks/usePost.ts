import { useQuery } from '@tanstack/react-query';
import { fetchPostById } from '../api/feedApi';

export const usePost = (postId: string | undefined) => {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => {
      if (!postId) throw new Error('Post ID is required');
      return fetchPostById(postId);
    },
    enabled: !!postId,
  });
};
