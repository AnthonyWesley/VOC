// identity/infra/repositories/PrismaUserRepository.ts

import { Prisma, PrismaClient } from "@prisma/client";
import { Post } from "../entities/Post";
import { IPostRepository, PaginatedPostsResult, PostListItemDTO } from "./IPostRepository";

export class PrismaPostRepository implements IPostRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Post | null> {
    const data = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!data) return null;

    return Post.rehydrate(data);
  }

  async findDetails(params: {
    postId: string;
    authUserId?: string;
  }): Promise<PostListItemDTO | null> {
    const where: Prisma.PostWhereInput = { id: params.postId };

    if (!params.authUserId) {
      // Visitante ou usuário não autenticado
      where.publishedAt = { not: null };
      where.visibility = "PUBLIC";
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

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      imageUrl: data.imageUrl,
      visibility: data.visibility,
      authorId: data.authorId,
      publishedAt: data.publishedAt,
      createdAt: data.createdAt,
      author: {
        fullName: data.author.member?.fullName ?? null,
        photoUrl: data.author.photoUrl ?? null,
        roles:
          data.author.roles.map((item) => ({
            name: item.role.name,
          })) ?? null,
      },
    };
  }

  async findAll(params: {
    authUserId?: string;
    isAdmin: boolean;
    limit?: number;
    cursor?: string | null;
  }): Promise<PaginatedPostsResult> {
    const { authUserId, isAdmin, limit = 20, cursor } = params;

    let where: Prisma.PostWhereInput = {};

    if (!isAdmin) {
      where = {
        OR: [
          { publishedAt: { not: null } },
          { authorId: authUserId ?? "" },
        ],
      };
    }

    const data = await this.prisma.post.findMany({
      orderBy: { createdAt: "desc" },
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

    const posts = data.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      category: item.category,
      imageUrl: item.imageUrl,
      visibility: item.visibility,
      authorId: item.authorId,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      author: {
        fullName: item.author.member?.fullName ?? null,
        photoUrl: item.author.photoUrl ?? null,
        roles:
          item.author.roles.map((item) => ({
            name: item.role.name,
          })) ?? null,
      },
    }));

    return { posts, nextCursor };
  }

  async findAllPublic(params?: {
    limit?: number;
    cursor?: string | null;
  }): Promise<PaginatedPostsResult> {
    const { limit = 20, cursor } = params ?? {};

    const data = await this.prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      where: { visibility: "PUBLIC", publishedAt: { not: null } },
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

    const posts = data.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      category: item.category,
      imageUrl: item.imageUrl,
      visibility: item.visibility,
      authorId: item.authorId,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      author: {
        fullName: item.author.member?.fullName ?? null,
        photoUrl: item.author.photoUrl ?? null,
        roles:
          item.author.roles.map((item) => ({
            name: item.role.name,
          })) ?? null,
      },
    }));

    return { posts, nextCursor };
  }

  async save(post: Post): Promise<void> {
    await this.prisma.post.upsert({
      where: { id: post.id },
      update: {
        title: post.title,
        content: post.content,
        category: post.category,
        imageUrl: post.imageUrl,
        visibility: post.visibility,
        // authorId: post.authorId,
        publishedAt: post.publishedAt,
      },
      create: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        imageUrl: post.imageUrl,
        visibility: post.visibility,
        authorId: post.authorId,
        publishedAt: post.publishedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
