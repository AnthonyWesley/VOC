import { PostVisibility } from "@prisma/client";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IPostRepository } from "../domain/repositories/IPostRepository";
import { IUserRepository } from "../../identity/domain/repositories/IUserRepository";

export type PublishPostInput = {
  postId: string;
  visibility: PostVisibility;
  authUserId: string;
};

export type PublishPostOutput = {
  id: string;
};

export class PublishPostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: PublishPostInput): Promise<PublishPostOutput> {
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

    let published = false;

    if (post.status === "DRAFT") {
      published = await this.postRepository.publishDraft(postId, authUserId);
    } else if (post.status === "ARCHIVED") {
      published = await this.postRepository.republishArchived(postId, authUserId);
    } else {
      throw new ConflictError("POST_ALREADY_PUBLISHED");
    }

    if (!published) {
      const state = await this.postRepository.findStateByIdIncludingDeleted(postId);
      if (!state) throw new NotFoundError("POST_NOT_FOUND");
      if (state.deletedAt) throw new NotFoundError("POST_NOT_FOUND");
      throw new ConflictError("POST_CANNOT_BE_PUBLISHED");
    }

    return { id: postId };
  }
}
