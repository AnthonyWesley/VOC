export type PostCategory = 'SERMON' | 'ANNOUNCEMENT' | 'EVENT_NEWS' | 'DEVOTIONAL';

export type PostSummary = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  category: PostCategory;
  visibility: 'PUBLIC' | 'INTERNAL';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
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

export type PaginatedPublicPostsResponse = {
  posts: PostSummary[];
  nextCursor: string | null;
};