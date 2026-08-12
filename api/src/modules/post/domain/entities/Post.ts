import { PostCategory, PostStatus, PostVisibility } from "@prisma/client";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { generateId } from "../../../../shared/utils/generateId";

export type PostProps = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  category: PostCategory;
  visibility: PostVisibility;

  status: PostStatus;

  firstPublishedAt: Date | null;
  publishedAt: Date | null;
  archivedAt: Date | null;
  deletedAt: Date | null;

  authorId: string;

  publishedById: string | null;
  archivedById: string | null;
  deletedById: string | null;

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

type ContentUpdateData = {
  title?: string;
  content?: string;
  category?: PostCategory;
  visibility?: PostVisibility;
  imageUrl?: string | null;
};

export class Post {
  private constructor(private props: PostProps) {}

  public static create(data: CreatePostProps): Post {
    if (!data.title?.trim()) throw new ValidationError("MISSING_TITLE");
    if (!data.content?.trim()) throw new ValidationError("MISSING_CONTENT");
    if (!data.category) throw new ValidationError("MISSING_CATEGORY");
    if (!data.authorId) throw new ValidationError("MISSING_AUTHOR_ID");

    const now = new Date();

    return new Post({
      id: generateId(),
      title: data.title.trim(),
      content: data.content.trim(),
      category: data.category,
      imageUrl: data.imageUrl ?? null,
      authorId: data.authorId,
      visibility: data.visibility,
      status: "DRAFT",
      firstPublishedAt: null,
      publishedAt: null,
      archivedAt: null,
      deletedAt: null,
      publishedById: null,
      archivedById: null,
      deletedById: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static rehydrate(props: PostProps): Post {
    return new Post({ ...props });
  }

  public updateContent(data: ContentUpdateData): void {
    if (this.props.deletedAt) {
      throw new ValidationError("POST_IS_DELETED");
    }

    let changed = false;

    if (data.title !== undefined) {
      if (!data.title.trim()) throw new ValidationError("TITLE_CANNOT_BE_EMPTY");
      this.props.title = data.title.trim();
      changed = true;
    }

    if (data.content !== undefined) {
      if (!data.content.trim()) throw new ValidationError("CONTENT_CANNOT_BE_EMPTY");
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

  public get visibility(): PostVisibility {
    return this.props.visibility;
  }

  public get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  public get status(): PostStatus {
    return this.props.status;
  }

  public get firstPublishedAt(): Date | null {
    return this.props.firstPublishedAt;
  }

  public get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  public get archivedAt(): Date | null {
    return this.props.archivedAt;
  }

  public get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  public get authorId(): string {
    return this.props.authorId;
  }

  public get publishedById(): string | null {
    return this.props.publishedById;
  }

  public get archivedById(): string | null {
    return this.props.archivedById;
  }

  public get deletedById(): string | null {
    return this.props.deletedById;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
