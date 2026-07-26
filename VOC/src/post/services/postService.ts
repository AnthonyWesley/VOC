import churchApi from "../../api/axios";
import {
  CreatePostInput,
  ListPostOutput,
  PublishPostInput,
  UpdatePostInput,
  PostDetails,
} from "../types/postTypes";

export type PaginatedPostsResponse = {
  posts: ListPostOutput[];
  nextCursor: string | null;
};

export const postService = {
  create: async (data: CreatePostInput) => {
    const response = await churchApi.post("/posts", data);
    return response.data;
  },

  find: async (postId: string): Promise<PostDetails> => {
    const response = await churchApi.get(`/posts/${postId}`);
    return response.data;
  },

  findPublic: async (postId: string): Promise<PostDetails> => {
    const response = await churchApi.get(`/posts/${postId}/public`);
    return response.data;
  },

  list: async (params?: {
    limit?: number;
    cursor?: string;
    status?: string;
  }): Promise<PaginatedPostsResponse> => {
    const queryParams: Record<string, any> = {};
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.cursor) queryParams.cursor = params.cursor;
    if (params?.status) queryParams.status = params.status;
    const response = await churchApi.get("/posts", { params: queryParams });
    return { posts: response.data.posts ?? [], nextCursor: response.data.nextCursor ?? null };
  },

  listPublic: async (params?: {
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedPostsResponse> => {
    const queryParams: Record<string, any> = {};
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.cursor) queryParams.cursor = params.cursor;
    const response = await churchApi.get("/posts/public", { params: queryParams });
    return { posts: response.data.posts ?? [], nextCursor: response.data.nextCursor ?? null };
  },

  update: async (data: UpdatePostInput) => {
    const { postId, ...fields } = data;
    const response = await churchApi.patch(`/posts/${postId}`, fields);
    return response.data;
  },

  delete: async (postId: string) => {
    const response = await churchApi.delete(`/posts/${postId}`);
    return response.data;
  },

  publish: async (data: PublishPostInput) => {
    const response = await churchApi.post(`/posts/${data.postId}/publish`, {
      visibility: data.visibility,
    });
    return response.data;
  },

  archive: async (postId: string) => {
    const response = await churchApi.post(`/posts/${postId}/archive`);
    return response.data;
  },
};
