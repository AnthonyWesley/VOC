import { Request, Response } from "express";
import { z } from "zod";

import { CreatePostUseCase } from "../../usecases/CreatePostUseCase";
import { PublishPostUseCase } from "../../usecases/PublishPostUseCase";
import { UnpublishPostUseCase } from "../../usecases/UnpublishPostUseCase";
import { UpdatePostUseCase } from "../../usecases/UpdatePostUseCase";
import { ListPostsUseCase } from "../../usecases/ListPostsUseCase";
import { ListPublicPostsUseCase } from "../../usecases/ListPublicPostsUseCase";
import { GetPostUseCase } from "../../usecases/GetPostUseCase";
import { GetPublicPostUseCase } from "../../usecases/GetPublicPostUseCase";

export class PostController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly publishPostUseCase: PublishPostUseCase,
    private readonly unpublishPostUseCase: UnpublishPostUseCase,
    private readonly getPostUseCase: GetPostUseCase,
    private readonly listPostsUseCase: ListPostsUseCase,
    private readonly getPublicPostUseCase: GetPublicPostUseCase,
    private readonly listPublicPostsUseCase: ListPublicPostsUseCase,
  ) {}

  async create(request: Request, response: Response): Promise<Response> {
    const schema = z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      category: z.enum(["SERMON", "ANNOUNCEMENT", "EVENT_NEWS", "DEVOTIONAL"]),
      visibility: z.enum(["PUBLIC", "INTERNAL"]),
      imageUrl: z.string().optional(),
      authorId: z.string().min(1),
    });
    const parsed = schema.parse(request.body);
    const result = await this.createPostUseCase.execute(parsed);

    return response.status(201).json(result);
  }

  async update(request: Request, response: Response): Promise<Response> {
    const postId = String(request.params.postId);

    const result = await this.updatePostUseCase.execute({
      ...request.body,
      postId,
      authUserId: request.auth!.userId,
    });

    return response.status(200).json(result);
  }

  async publish(request: Request, response: Response): Promise<Response> {
    const postId = String(request.params.postId);

    const result = await this.publishPostUseCase.execute({
      ...request.body,
      postId,
      authUserId: request.auth!.userId,
    });

    return response.status(200).json(result);
  }

  async unpublish(request: Request, response: Response): Promise<Response> {
    const postId = String(request.params.postId);
    const result = await this.unpublishPostUseCase.execute({
      postId,
      authUserId: request.auth!.userId,
    });

    return response.status(200).json(result);
  }

  async get(request: Request, response: Response): Promise<Response> {
    const postId = String(request.params.postId);

    const result = await this.getPostUseCase.execute({
      authUserId: request.auth!.userId,
      postId,
    });

    return response.status(200).json(result);
  }

  async list(request: Request, response: Response): Promise<Response> {
    const { limit = "20", cursor } = request.query;

    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);

    const result = await this.listPostsUseCase.execute({
      authUserId: request.auth!.userId,
      limit: parsedLimit,
      cursor: cursor ? String(cursor) : undefined,
    });

    return response.status(200).json(result);
  }

  async getPublic(request: Request, response: Response): Promise<Response> {
    const postId = String(request.params.postId);

    const result = await this.getPublicPostUseCase.execute({ postId });

    return response.status(200).json(result);
  }

  async listPublic(request: Request, response: Response): Promise<Response> {
    const { limit = "20", cursor } = request.query;

    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);

    const result = await this.listPublicPostsUseCase.execute({
      limit: parsedLimit,
      cursor: cursor ? String(cursor) : undefined,
    });

    return response.status(200).json(result);
  }
}
