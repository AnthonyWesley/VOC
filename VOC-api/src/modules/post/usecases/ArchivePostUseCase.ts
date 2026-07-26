import { ConflictError } from "../../../shared/errors/ConflictError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IPostRepository } from "../domain/repositories/IPostRepository";
import { IUserRepository } from "../../identity/domain/repositories/IUserRepository";

export type ArchivePostInput = {
  postId: string;
  authUserId: string;
};

export type ArchivePostOutput = {
  id: string;
};

export class ArchivePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: ArchivePostInput): Promise<ArchivePostOutput> {
    const { postId, authUserId } = input;

    if (!postId) throw new ValidationError("MISSING_POST_ID");

    const post = await this.postRepository.findById(postId);
    if (!post) throw new NotFoundError("POST_NOT_FOUND");

    if (post.status !== "PUBLISHED") {
      throw new ConflictError("ONLY_PUBLISHED_CAN_BE_ARCHIVED");
    }

    const isOwner = post.authorId === authUserId;
    const user = await this.userRepository.findById(authUserId);
    const isPresident = user ? user.highestLevel >= 100 : false;

    if (!isOwner && !isPresident) {
      throw new ForbiddenError("NOT_POST_OWNER");
    }

    const archived = await this.postRepository.archivePublished(postId, authUserId);
    if (!archived) {
      const state = await this.postRepository.findStateByIdIncludingDeleted(postId);
      if (!state) throw new NotFoundError("POST_NOT_FOUND");
      if (state.deletedAt) throw new NotFoundError("POST_NOT_FOUND");
      throw new ConflictError("POST_CANNOT_BE_ARCHIVED");
    }

    return { id: postId };
  }
}
