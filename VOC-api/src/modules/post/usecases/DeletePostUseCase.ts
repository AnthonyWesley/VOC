import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IPostRepository } from "../domain/repositories/IPostRepository";
import { IUserRepository } from "../../identity/domain/repositories/IUserRepository";

export type DeletePostInput = {
  postId: string;
  authUserId: string;
};

export class DeletePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: DeletePostInput): Promise<void> {
    if (!input.postId) throw new ValidationError("MISSING_POST_ID");

    const post = await this.postRepository.findById(input.postId);
    if (!post) throw new NotFoundError("POST_NOT_FOUND");

    const isOwner = post.authorId === input.authUserId;
    const user = await this.userRepository.findById(input.authUserId);
    const isPresident = user ? user.highestLevel >= 100 : false;

    if (!isOwner && !isPresident) {
      throw new ForbiddenError("NOT_POST_OWNER");
    }

    await this.postRepository.delete(input.postId);
  }
}
