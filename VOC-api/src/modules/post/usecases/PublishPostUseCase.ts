import { PostVisibility } from "@prisma/client";
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

    if (!postId) {
      throw new ValidationError("MISSING_POST_ID");
    }

    const post = await this.postRepository.findById(postId);

    if (!post) {
      throw new NotFoundError("POST_NOT_FOUND");
    }

    const isOwner = post.authorId === authUserId;
    const user = await this.userRepository.findById(authUserId);
    const isPresident = user ? user.highestLevel >= 100 : false;

    if (!isOwner && !isPresident) {
      throw new ForbiddenError("NOT_POST_OWNER");
    }

    post.publish(input.visibility);
    await this.postRepository.save(post);

    return {
      id: post.id,
    };
  }
}
