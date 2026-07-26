import { Prisma, PrismaClient } from "@prisma/client";
import { Post } from "../entities/Post";
import { NotFoundError } from "../../../../shared/errors/NotFoundError";
import {
  IPostRepository,
  PaginatedPostsResult,
  PostListItemDTO,
  PostStateInfo,
} from "./IPostRepository";

export class PrismaPostRepository implements IPostRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Post | null> {
    const data = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });

    if (!data) return null;

    return Post.rehydrate(data);
  }

  async findDetails(params: {
    postId: string;
    authUserId?: string;
    isAdmin?: boolean;
  }): Promise<PostListItemDTO | null> {
    const where: Prisma.PostWhereInput = {
      id: params.postId,
      deletedAt: null,
    };

    if (!params.isAdmin) {
      const conditions: Prisma.PostWhereInput[] = [
        { status: "PUBLISHED", visibility: "PUBLIC" },
      ];

      if (params.authUserId) {
        conditions.push({
          status: "PUBLISHED",
          visibility: "INTERNAL",
        });
        conditions.push({ authorId: params.authUserId });
      }

      where.OR = conditions;
    }

    const data = await this.prisma.post.findFirst({
      where,
      include: {
        author: {
          select: {
            photoUrl: true,
            roles: { select: { role: { select: { name: true } } } },
            member: { select: { fullName: true } },
          },
        },
      },
    });

    if (!data) return null;

    return this.toListItem(data);
  }

  async findAll(params: {
    authUserId?: string;
    isAdmin: boolean;
    limit?: number;
    cursor?: string | null;
    status?: string;
  }): Promise<PaginatedPostsResult> {
    const { authUserId, isAdmin, limit = 20, cursor, status } = params;

    const where: Prisma.PostWhereInput = { deletedAt: null };

    if (status) {
      where.status = status as any;
    }

    if (!isAdmin) {
      where.OR = [
        { status: "PUBLISHED" },
        { authorId: authUserId ?? "" },
      ];
      if (authUserId) {
        where.OR = [
          { status: "PUBLISHED" },
          { authorId: authUserId },
        ];
      }
    }

    const data = await this.prisma.post.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        author: {
          select: {
            photoUrl: true,
            roles: { select: { role: true } },
            member: { select: { fullName: true } },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (data.length > limit) {
      const nextItem = data.pop();
      nextCursor = nextItem!.id;
    }

    const posts = data.map((item) => this.toListItem(item));

    return { posts, nextCursor };
  }

  async findAllPublic(params?: {
    limit?: number;
    cursor?: string | null;
  }): Promise<PaginatedPostsResult> {
    const { limit = 20, cursor } = params ?? {};

    const data = await this.prisma.post.findMany({
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        deletedAt: null,
        publishedAt: { not: null },
      },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        author: {
          select: {
            photoUrl: true,
            roles: { select: { role: { select: { name: true } } } },
            member: { select: { fullName: true } },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (data.length > limit) {
      const nextItem = data.pop();
      nextCursor = nextItem!.id;
    }

    const posts = data.map((item) => this.toListItem(item));

    return { posts, nextCursor };
  }

  async create(post: Post): Promise<void> {
    await this.prisma.post.create({
      data: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        imageUrl: post.imageUrl,
        visibility: post.visibility,
        status: post.status,
        authorId: post.authorId,
      },
    });
  }

  async updateContent(post: Post): Promise<boolean> {
    const result = await this.prisma.post.updateMany({
      where: {
        id: post.id,
        deletedAt: null,
        status: { in: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
      },
      data: {
        title: post.title,
        content: post.content,
        category: post.category,
        visibility: post.visibility,
        imageUrl: post.imageUrl,
      },
    });

    return result.count === 1;
  }

  async publishDraft(id: string, userId: string): Promise<boolean> {
    const now = new Date();
    const result = await this.prisma.post.updateMany({
      where: {
        id,
        status: "DRAFT",
        deletedAt: null,
      },
      data: {
        status: "PUBLISHED",
        firstPublishedAt: now,
        publishedAt: now,
        publishedById: userId,
      },
    });

    return result.count === 1;
  }

  async republishArchived(id: string, userId: string): Promise<boolean> {
    const now = new Date();
    const result = await this.prisma.post.updateMany({
      where: {
        id,
        status: "ARCHIVED",
        deletedAt: null,
      },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        publishedById: userId,
        archivedAt: null,
        archivedById: null,
      },
    });

    return result.count === 1;
  }

  async archivePublished(id: string, userId: string): Promise<boolean> {
    const now = new Date();
    const result = await this.prisma.post.updateMany({
      where: {
        id,
        status: "PUBLISHED",
        deletedAt: null,
      },
      data: {
        status: "ARCHIVED",
        archivedAt: now,
        archivedById: userId,
      },
    });

    return result.count === 1;
  }

  async hardDeleteDraft(id: string): Promise<boolean> {
    const result = await this.prisma.post.deleteMany({
      where: {
        id,
        status: "DRAFT",
        deletedAt: null,
        firstPublishedAt: null,
      },
    });

    return result.count === 1;
  }

  async softDeletePost(id: string, userId: string): Promise<boolean> {
    const now = new Date();
    const result = await this.prisma.post.updateMany({
      where: {
        id,
        status: { in: ["PUBLISHED", "ARCHIVED"] },
        deletedAt: null,
      },
      data: {
        deletedAt: now,
        deletedById: userId,
      },
    });

    return result.count === 1;
  }

  async findStateByIdIncludingDeleted(
    id: string,
  ): Promise<PostStateInfo | null> {
    const data = await this.prisma.post.findUnique({
      where: { id },
      select: {
        status: true,
        deletedAt: true,
        firstPublishedAt: true,
      },
    });

    return data;
  }

  private toListItem(item: any): PostListItemDTO {
    return {
      id: item.id,
      title: item.title,
      content: item.content,
      category: item.category,
      imageUrl: item.imageUrl,
      visibility: item.visibility,
      authorId: item.authorId,
      status: item.status,
      firstPublishedAt: item.firstPublishedAt,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      author: {
        fullName: item.author.member?.fullName ?? null,
        photoUrl: item.author.photoUrl ?? null,
        roles:
          item.author.roles?.map((r: any) => ({
            name: r.role?.name ?? r.name,
          })) ?? null,
      },
    };
  }
}
