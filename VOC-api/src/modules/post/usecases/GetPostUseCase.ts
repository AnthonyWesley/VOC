import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IUserRepository } from "../../identity/domain/repositories/IUserRepository";
import {
  IPostRepository,
  PostListItemDTO,
} from "../domain/repositories/IPostRepository";

export interface GetPostInputDTO {
  authUserId: string | null;
  postId: string;
}
export interface GetPostResponseDTO {
  posts: PostListItemDTO[];
}

export class GetPostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(input: GetPostInputDTO): Promise<PostListItemDTO> {
    const { postId, authUserId } = input;

    if (!postId) {
      throw new ValidationError("MISSING_POST_ID");
    }

    const post = await this.postRepository.findDetails({
      postId: input?.postId,
      authUserId: authUserId ?? null,
    });

    if (!post) {
      throw new NotFoundError("POST_NOT_FOUND");
    }

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      imageUrl: post.imageUrl,
      visibility: post.visibility,
      authorId: post.authorId,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      author: {
        fullName: post.author.fullName ?? null,
        photoUrl: post.author.photoUrl ?? null,
        roles: post.author.roles ?? [],
      },
    };
  }
}
