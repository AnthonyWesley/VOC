import { ConflictError } from "../../../shared/errors/ConflictError";
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
    const { postId, authUserId } = input;

    if (!postId) throw new ValidationError("MISSING_POST_ID");

    const post = await this.postRepository.findById(postId);
    if (!post) throw new NotFoundError("POST_NOT_FOUND");

    const isOwner = post.authorId === authUserId;
    const user = await this.userRepository.findById(authUserId);
    const isPresident = user ? user.highestLevel >= 100 : false;

    if (!isOwner && !isPresident) {
      throw new ForbiddenError("NOT_POST_OWNER");
    }

    let deleted = false;

    if (post.status === "DRAFT") {
      deleted = await this.postRepository.hardDeleteDraft(postId);
    } else if (post.status === "PUBLISHED" || post.status === "ARCHIVED") {
      deleted = await this.postRepository.softDeletePost(postId, authUserId);
    }

    if (!deleted) {
      const state = await this.postRepository.findStateByIdIncludingDeleted(postId);
      if (!state) throw new NotFoundError("POST_NOT_FOUND");
      if (state.deletedAt) throw new NotFoundError("POST_NOT_FOUND");
      throw new ConflictError("POST_CANNOT_BE_DELETED");
    }
  }
}
