import churchApi from "../../api/axios";
import {
  CreatePostInput,
  ListPostOutput,
  PublishPostInput,
  UnpublishPostInput,
  UpdatePostInput,
} from "../types/postTypes";

export type PaginatedPostsResponse = {
  posts: ListPostOutput[];
  nextCursor: string | null;
};

export const postService = {
  // CREATE
  create: async (data: CreatePostInput) => {
    const response = await churchApi.post("/posts", data);
    return response.data;
  },

  // FIND ONE
  find: async (postId: string) => {
    const response = await churchApi.get(`/posts/${postId}`);
    return response.data;
  },

  findPublic: async (postId: string) => {
    const response = await churchApi.get(`/posts/${postId}/public`);
    return response.data;
  },

  // LIST ALL
  list: async (params?: {
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedPostsResponse> => {
    const queryParams: Record<string, any> = {};
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.cursor) queryParams.cursor = params.cursor;
    const response = await churchApi.get(`/posts`, { params: queryParams });
    return { posts: response.data.posts ?? [], nextCursor: response.data.nextCursor ?? null };
  },

  listPublic: async (params?: {
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedPostsResponse> => {
    const queryParams: Record<string, any> = {};
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.cursor) queryParams.cursor = params.cursor;
    const response = await churchApi.get(`/posts/public`, { params: queryParams });
    return { posts: response.data.posts ?? [], nextCursor: response.data.nextCursor ?? null };
  },

  // UPDATE
  update: async (data: UpdatePostInput) => {
    const { postId, ...fields } = data;
    const response = await churchApi.patch(`/posts/${postId}`, fields);
    return response.data;
  },

  // DELETE
  delete: async (postId: string) => {
    const response = await churchApi.delete(`/posts/${postId}`);
    return response.data;
  },

  // PUBLISH
  publish: async (data: PublishPostInput) => {
    const response = await churchApi.patch(`/posts/${data.postId}/publish`, {
      visibility: data.visibility,
    });
    return response.data;
  },

  // UNPUBLISH
  unpublish: async (data: UnpublishPostInput) => {
    const response = await churchApi.patch(`/posts/${data.postId}/unpublish`);
    return response.data;
  },
};
