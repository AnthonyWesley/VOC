import { IPostRepository } from "../domain/repositories/IPostRepository";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { Post } from "../domain/entities/Post";
import { PostCategory, PostVisibility } from "@prisma/client";

export type CreatePostInput = {
  title: string;
  content: string;
  category: PostCategory;
  imageUrl?: string;
  authorId: string;
  visibility: PostVisibility;
};

export type CreatePostOutput = {
  id: string;
};

export class CreatePostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(input: CreatePostInput): Promise<CreatePostOutput> {
    const { title, content, category, imageUrl, authorId, visibility } = input;

    if (!title) throw new ValidationError("MISSING_TITLE");
    if (!content) throw new ValidationError("MISSING_CONTENT");
    if (!category) throw new ValidationError("MISSING_CATEGORY");
    if (!authorId) throw new ValidationError("MISSING_AUTHOR_ID");

    const post = Post.create({
      title,
      content,
      category,
      authorId,
      visibility,
      imageUrl,
    });

    await this.postRepository.create(post);

    return { id: post.id };
  }
}
