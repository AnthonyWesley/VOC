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

export type UnpublishPostInput = {
  postId: string;
};

export type UpdatePostInput = {
  postId: string;
  title?: string;
  content?: string;
  category?: PostCategory;
  visibility?: PostVisibility;
  imageUrl?: string;
};

export type ListPostOutput = {
  id: string;
  author: {
    fullName: string | null;
    photoUrl: string | null;
    roles: { id: string; name: string }[];
  };
  authorId: string;
  title?: string;
  content?: string;
  category?: PostCategory;
  visibility?: PostVisibility;
  imageUrl?: string;
  publishedAt?: string | null;
  createdAt: string;
};
