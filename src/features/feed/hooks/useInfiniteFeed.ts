import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFeed } from '../api/feedApi';
import { useMemo } from 'react';

export const useInfiniteFeed = (limit: number = 10) => {
  const query = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => fetchFeed(pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.data || lastPage.data.length < limit) {
        return undefined;
      }

      return lastPage.data[lastPage.data.length - 1].publishedAt;
    },
  });


  const posts = useMemo(() => {
    if (!query.data) return [];
    
    const allPosts = query.data.pages.flatMap(page => page.data || []);
    const seenIds = new Set<string>();
    
    return allPosts.filter(post => {
      if (seenIds.has(post.id)) {
        return false;
      }
      seenIds.add(post.id);
      return true;
    });
  }, [query.data]);

  return {
    ...query,
    posts,
    isEmpty: posts.length === 0 && !query.isLoading,
  };
};
