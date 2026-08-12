import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { PaginatedPublicPostsResponse } from '../types/postTypes';
import { postsService } from '../services/postsService';

export function usePublicPosts(limit = 20) {
  const queryPosts = useInfiniteQuery<PaginatedPublicPostsResponse, Error>({
    queryKey: ['postsPublic', 'infinite', limit],
    queryFn: ({ pageParam }) => {
      const cursor = typeof pageParam === 'string' ? pageParam : undefined;
      return postsService.listPublic({ limit, cursor });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const posts = useMemo(
    () => queryPosts.data?.pages.flatMap((page) => page.posts) ?? [],
    [queryPosts.data],
  );

  return { queryPosts, posts };
}