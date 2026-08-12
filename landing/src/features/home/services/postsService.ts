import { api } from '@/lib/api';
import { PaginatedPublicPostsResponse } from '../types/postTypes';

export const postsService = {
  listPublic: async (params?: {
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedPublicPostsResponse> => {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.cursor) queryParams.cursor = params.cursor;
    const response = await api.get<PaginatedPublicPostsResponse>('/posts/public', {
      params: queryParams,
    });
    return {
      posts: response.data.posts ?? [],
      nextCursor: response.data.nextCursor ?? null,
    };
  },
};