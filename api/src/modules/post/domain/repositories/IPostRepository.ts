import { PostStatus } from "@prisma/client";
import { Post } from "../entities/Post";

export interface PostListItemDTO {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl: string | null;
  visibility: string;
  authorId: string;
  status: string;
  firstPublishedAt: Date | null;
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

export type PostStateInfo = {
  status: PostStatus;
  deletedAt: Date | null;
  firstPublishedAt: Date | null;
};

export interface IPostRepository {
  findById(id: string): Promise<Post | null>;
  findDetails(params: {
    postId: string;
    authUserId?: string | null;
    isAdmin?: boolean;
  }): Promise<PostListItemDTO | null>;
  findAll(params: {
    authUserId?: string;
    isAdmin: boolean;
    limit?: number;
    cursor?: string | null;
    status?: string;
  }): Promise<PaginatedPostsResult>;
  findAllPublic(params?: {
    limit?: number;
    cursor?: string | null;
  }): Promise<PaginatedPostsResult>;
  create(post: Post): Promise<void>;
  updateContent(post: Post): Promise<boolean>;
  publishDraft(id: string, userId: string): Promise<boolean>;
  republishArchived(id: string, userId: string): Promise<boolean>;
  archivePublished(id: string, userId: string): Promise<boolean>;
  hardDeleteDraft(id: string): Promise<boolean>;
  softDeletePost(id: string, userId: string): Promise<boolean>;
  findStateByIdIncludingDeleted(id: string): Promise<PostStateInfo | null>;
}
