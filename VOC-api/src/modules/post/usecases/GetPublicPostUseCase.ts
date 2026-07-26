import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import {
  IPostRepository,
  PostListItemDTO,
} from "../domain/repositories/IPostRepository";

export interface GetPublicPostInputDTO {
  postId: string;
}

export class GetPublicPostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(input: GetPublicPostInputDTO): Promise<PostListItemDTO> {
    const { postId } = input;

    if (!postId) throw new ValidationError("MISSING_POST_ID");

    const post = await this.postRepository.findDetails({
      postId,
    });

    if (!post) throw new NotFoundError("POST_NOT_FOUND");

    return post;
  }
}
