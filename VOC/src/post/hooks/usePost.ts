import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { postService, PaginatedPostsResponse } from "../services/postService";
import { useMemo } from "react";

type UseUserParams = {
  postId?: string;
  limit?: number;
  status?: string;
};

export default function usePost(params?: UseUserParams) {
  const { isAuthenticated } = useAuthStatus();
  const pageLimit = params?.limit ?? 20;

  const queryPost = useQuery({
    queryKey: ["postData", params?.postId],
    queryFn: () =>
      isAuthenticated
        ? postService.find(params?.postId ?? "")
        : postService.findPublic(params?.postId ?? ""),
    enabled: !!params?.postId,
  });

  const queryPosts = useInfiniteQuery<PaginatedPostsResponse, Error>({
    queryKey: ["postsData", "infinite", pageLimit, params?.status],
    queryFn: ({ pageParam }) => {
      const cursor = typeof pageParam === "string" ? pageParam : undefined;
      return isAuthenticated
        ? postService.list({ limit: pageLimit, cursor, status: params?.status })
        : postService.listPublic({ limit: pageLimit, cursor });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const allPosts = useMemo(
    () => queryPosts.data?.pages.flatMap((p) => p.posts) ?? [],
    [queryPosts.data],
  );

  return { queryPost, queryPosts, allPosts };
}
