export const PostVisibility = {
  PUBLIC: "PUBLIC",
  INTERNAL: "INTERNAL",
} as const;

export type PostVisibility =
  (typeof PostVisibility)[keyof typeof PostVisibility];

export const PostCategory = {
  SERMON: "SERMON",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  EVENT_NEWS: "EVENT_NEWS",
  DEVOTIONAL: "DEVOTIONAL",
} as const;

export type PostCategory = (typeof PostCategory)[keyof typeof PostCategory];

export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type CreatePostInput = {
  title: string;
  content: string;
  category: PostCategory;
  imageUrl?: string;
  authorId: string;
  visibility: PostVisibility;
};

export type PublishPostInput = {
  postId: string;
  visibility: PostVisibility;
};

export type UpdatePostInput = {
  postId: string;
  title?: string;
  content?: string;
  category?: PostCategory;
  visibility?: PostVisibility;
  imageUrl?: string;
};

export type PostSummary = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  category: PostCategory;
  visibility: PostVisibility;
  status: PostStatus;
  authorId: string;
  firstPublishedAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    fullName: string | null;
    photoUrl: string | null;
    roles: { id: string; name: string }[];
  };
};

export type PostDetails = PostSummary;

export type PostFormValues = {
  title: string;
  content: string;
  imageUrl: string;
  category: PostCategory;
  visibility: PostVisibility;
};

export type ListPostOutput = PostSummary;
