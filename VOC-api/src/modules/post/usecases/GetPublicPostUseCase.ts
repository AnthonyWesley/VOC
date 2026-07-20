import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import {
  IPostRepository,
  PostListItemDTO,
} from "../domain/repositories/IPostRepository";

export interface GetPublicPostInputDTO {
  postId: string;
}
export interface GetPublicPostResponseDTO {
  posts: PostListItemDTO[];
}

export class GetPublicPostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(input: GetPublicPostInputDTO): Promise<PostListItemDTO> {
    const { postId } = input;

    if (!postId) {
      throw new ValidationError("MISSING_POST_ID");
    }

    const post = await this.postRepository.findDetails({
      postId: input?.postId,
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
