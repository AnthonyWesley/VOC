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

export class GetPostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetPostInputDTO): Promise<PostListItemDTO> {
    if (!input.postId) throw new ValidationError("MISSING_POST_ID");

    let isAdmin = false;
    if (input.authUserId) {
      const authUser = await this.userRepository.findById(input.authUserId);
      isAdmin = authUser ? authUser.highestLevel >= 100 : false;
    }

    const post = await this.postRepository.findDetails({
      postId: input.postId,
      authUserId: input.authUserId ?? null,
      isAdmin,
    });

    if (!post) throw new NotFoundError("POST_NOT_FOUND");

    return post;
  }
}
