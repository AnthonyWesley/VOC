// identity/domain/entities/Post.ts

import { PostCategory, PostVisibility } from "@prisma/client";
import { ConflictError } from "../../../../shared/errors/ConflictError";
import { generateId } from "../../../../shared/utils/generateId";

export type PostProps = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  category: PostCategory;
  visibility: PostVisibility;

  authorId: string;

  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePostProps = {
  title: string;
  content: string;
  category: PostCategory;
  imageUrl?: string;
  authorId: string;
  visibility: PostVisibility;
};

export class Post {
  private constructor(private props: PostProps) {}

  public static create(data: CreatePostProps): Post {
    if (!data.title?.trim()) throw new Error("Title is required");
    if (!data.content?.trim()) throw new Error("Content is required");
    if (!data.category) throw new Error("Category is required");
    if (!data.authorId) throw new Error("AuthorId is required");

    const now = new Date();

    return new Post({
      id: generateId(),
      title: data.title.trim(),
      content: data.content.trim(),
      category: data.category,
      imageUrl: data.imageUrl ?? null,
      authorId: data.authorId,
      visibility: data.visibility,
      publishedAt: data.visibility ? now : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static rehydrate(props: PostProps): Post {
    return new Post({ ...props });
  }

  public update(data: {
    title?: string;
    content?: string;
    category?: PostCategory;
    visibility?: PostVisibility;
    imageUrl?: string | null;
  }): void {
    let changed = false;

    if (data.title !== undefined) {
      if (!data.title.trim()) throw new Error("Title cannot be empty");
      this.props.title = data.title.trim();
      changed = true;
    }

    if (data.content !== undefined) {
      if (!data.content.trim()) throw new Error("Content cannot be empty");
      this.props.content = data.content.trim();
      changed = true;
    }

    if (data.category !== undefined) {
      this.props.category = data.category;
      changed = true;
    }

    if (data.imageUrl !== undefined) {
      this.props.imageUrl = data.imageUrl;
      changed = true;
    }
    if (data.visibility !== undefined) {
      this.props.visibility = data.visibility;
      changed = true;
    }

    if (changed) {
      this.props.updatedAt = new Date();
    }
  }

  public publish(who: PostVisibility): void {
    if (this.props.publishedAt) {
      throw new ConflictError("POST_ALREADY_PUBLISHED");
    }

    this.props.visibility = who;
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public unpublish(): void {
    if (!this.props.visibility) {
      throw new ConflictError("POST_ALREADY_UNPUBLISHED");
    }

    // this.props.visibility = false;
    this.props.publishedAt = null;
    this.props.updatedAt = new Date();
  }

  // ---------------------------
  // GETTERS
  // ---------------------------
  public get id(): string {
    return this.props.id;
  }

  public get title(): string {
    return this.props.title;
  }

  public get content(): string {
    return this.props.content;
  }

  public get category(): PostCategory {
    return this.props.category;
  }

  public get authorId(): string {
    return this.props.authorId;
  }

  public get visibility(): PostVisibility {
    return this.props.visibility;
  }

  public get imageUrl(): string | null {
    return this.props.imageUrl ?? null;
  }

  public get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
