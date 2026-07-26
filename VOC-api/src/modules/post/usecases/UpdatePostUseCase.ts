import { PostCategory, PostVisibility } from "@prisma/client";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IPostRepository } from "../domain/repositories/IPostRepository";
import { IUserRepository } from "../../identity/domain/repositories/IUserRepository";

export type UpdatePostInput = {
  postId: string;
  title?: string;
  content?: string;
  category?: PostCategory;
  visibility?: PostVisibility;
  imageUrl?: string;
  authUserId: string;
};

export type UpdatePostOutput = {
  id: string;
};

export class UpdatePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: UpdatePostInput): Promise<UpdatePostOutput> {
    const { postId, title, content, category, imageUrl, visibility, authUserId } = input;

    if (!postId) throw new ValidationError("MISSING_POST_ID");

    const post = await this.postRepository.findById(postId);
    if (!post) throw new NotFoundError("POST_NOT_FOUND");

    const isOwner = post.authorId === authUserId;
    const user = await this.userRepository.findById(authUserId);
    const isPresident = user ? user.highestLevel >= 100 : false;

    if (!isOwner && !isPresident) {
      throw new ForbiddenError("NOT_POST_OWNER");
    }

    post.updateContent({
      title,
      content,
      category,
      imageUrl: imageUrl ?? undefined,
      visibility,
    });

    const updated = await this.postRepository.updateContent(post);
    if (!updated) {
      throw new NotFoundError("POST_NOT_FOUND");
    }

    return { id: post.id };
  }
}
