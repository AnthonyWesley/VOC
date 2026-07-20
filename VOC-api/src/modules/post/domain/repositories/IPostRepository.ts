// identity/domain/repositories/IUserRepository.ts

import { Post } from "../entities/Post";

export interface PostListItemDTO {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl: string | null;
  visibility: string;
  authorId: string;
  publishedAt: Date | null;
  createdAt: Date;
  author: {
    fullName: string | null;
    photoUrl: string | null;
    roles: { name: string }[];
  };
}

export type PaginatedPostsResult = {
  posts: PostListItemDTO[];
  nextCursor: string | null;
};

export interface IPostRepository {
  findById(id: string): Promise<Post | null>;
  findDetails(params: {
    postId: string;
    authUserId?: string | null;
  }): Promise<PostListItemDTO | null>;
  findAll(params: {
    authUserId?: string;
    isAdmin: boolean;
    limit?: number;
    cursor?: string | null;
  }): Promise<PaginatedPostsResult>;
  findAllPublic(params?: {
    limit?: number;
    cursor?: string | null;
  }): Promise<PaginatedPostsResult>;
  save(user: Post): Promise<void>;
  delete(id: string): Promise<void>;
}
