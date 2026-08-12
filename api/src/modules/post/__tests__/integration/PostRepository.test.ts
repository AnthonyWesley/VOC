import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPostRepository } from "../../domain/repositories/PrismaPostRepository";
import { Post } from "../../domain/entities/Post";
import { generateId } from "../../../../shared/utils/generateId";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

const repo = new PrismaPostRepository(prisma);

let authorId: string;
let adminId: string;

beforeAll(async () => {
  authorId = generateId();
  adminId = generateId();

  await prisma.user.createMany({
    data: [
      { id: authorId, email: "post-test-author@test.com", passwordHash: "hash" },
      { id: adminId, email: "post-test-admin@test.com", passwordHash: "hash" },
    ],
  });
});

afterAll(async () => {
  await prisma.post.deleteMany({ where: { authorId: { in: [authorId, adminId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [authorId, adminId] } } });
  await prisma.$disconnect();
});

async function createDraftPost(): Promise<Post> {
  const post = Post.create({
    title: "Draft Test",
    content: "Content",
    category: "SERMON",
    visibility: "PUBLIC",
    authorId,
  });
  await repo.create(post);
  return post;
}

describe("PostRepository — CAS transitions", () => {
  it("publishDraft: DRAFT → PUBLISHED", async () => {
    const post = await createDraftPost();

    const result = await repo.publishDraft(post.id, authorId);

    expect(result).toBe(true);

    const found = await repo.findById(post.id);
    expect(found).not.toBeNull();
    expect(found!.status).toBe("PUBLISHED");
    expect(found!.firstPublishedAt).not.toBeNull();
    expect(found!.publishedAt).not.toBeNull();
    expect(found!.publishedById).toBe(authorId);
  });

  it("publishDraft: already PUBLISHED returns false", async () => {
    const post = await createDraftPost();
    await repo.publishDraft(post.id, authorId);
    const result = await repo.publishDraft(post.id, authorId);
    expect(result).toBe(false);
  });

  it("archivePublished: PUBLISHED → ARCHIVED", async () => {
    const post = await createDraftPost();
    await repo.publishDraft(post.id, authorId);

    const result = await repo.archivePublished(post.id, authorId);
    expect(result).toBe(true);

    const found = await repo.findById(post.id);
    expect(found).not.toBeNull();
    expect(found!.status).toBe("ARCHIVED");
    expect(found!.archivedAt).not.toBeNull();
    expect(found!.archivedById).toBe(authorId);
  });

  it("archivePublished: DRAFT returns false", async () => {
    const post = await createDraftPost();
    const result = await repo.archivePublished(post.id, authorId);
    expect(result).toBe(false);
  });

  it("republishArchived: ARCHIVED → PUBLISHED", async () => {
    const post = await createDraftPost();
    await repo.publishDraft(post.id, authorId);
    await repo.archivePublished(post.id, authorId);

    const result = await repo.republishArchived(post.id, authorId);
    expect(result).toBe(true);

    const found = await repo.findById(post.id);
    expect(found).not.toBeNull();
    expect(found!.status).toBe("PUBLISHED");
    expect(found!.archivedAt).toBeNull();
    expect(found!.archivedById).toBeNull();
    expect(found!.publishedById).toBe(authorId);
  });

  it("hardDeleteDraft: removes DRAFT permanently", async () => {
    const post = await createDraftPost();
    const result = await repo.hardDeleteDraft(post.id);
    expect(result).toBe(true);

    const found = await repo.findById(post.id);
    expect(found).toBeNull();
  });

  it("hardDeleteDraft: PUBLISHED returns false", async () => {
    const post = await createDraftPost();
    await repo.publishDraft(post.id, authorId);
    const result = await repo.hardDeleteDraft(post.id);
    expect(result).toBe(false);
  });

  it("softDeletePost: PUBLISHED → deletedAt set", async () => {
    const post = await createDraftPost();
    await repo.publishDraft(post.id, authorId);

    const result = await repo.softDeletePost(post.id, adminId);
    expect(result).toBe(true);

    const state = await repo.findStateByIdIncludingDeleted(post.id);
    expect(state).not.toBeNull();
    expect(state!.deletedAt).not.toBeNull();
  });

  it("softDeletePost: soft-deleted not returned by findById", async () => {
    const post = await createDraftPost();
    await repo.publishDraft(post.id, authorId);
    await repo.softDeletePost(post.id, adminId);

    const found = await repo.findById(post.id);
    expect(found).toBeNull();
  });

  it("softDeletePost: ARCHIVED can be soft-deleted", async () => {
    const post = await createDraftPost();
    await repo.publishDraft(post.id, authorId);
    await repo.archivePublished(post.id, authorId);

    const result = await repo.softDeletePost(post.id, adminId);
    expect(result).toBe(true);

    const state = await repo.findStateByIdIncludingDeleted(post.id);
    expect(state!.deletedAt).not.toBeNull();
  });

  it("softDeletePost: already soft-deleted returns false", async () => {
    const post = await createDraftPost();
    await repo.publishDraft(post.id, authorId);
    await repo.softDeletePost(post.id, adminId);

    const result = await repo.softDeletePost(post.id, adminId);
    expect(result).toBe(false);
  });
});

describe("PostRepository — findStateByIdIncludingDeleted", () => {
  it("returns status, deletedAt, firstPublishedAt for deleted post", async () => {
    const post = await createDraftPost();
    await repo.publishDraft(post.id, authorId);
    await repo.softDeletePost(post.id, adminId);

    const state = await repo.findStateByIdIncludingDeleted(post.id);
    expect(state).toEqual({
      status: "PUBLISHED",
      deletedAt: expect.any(Date),
      firstPublishedAt: expect.any(Date),
    });
  });

  it("returns null for non-existent id", async () => {
    const state = await repo.findStateByIdIncludingDeleted("non-existent");
    expect(state).toBeNull();
  });
});

describe("PostRepository — updateContent", () => {
  it("updates content on DRAFT", async () => {
    const post = await createDraftPost();
    post.updateContent({ title: "Updated Title" });

    const result = await repo.updateContent(post);
    expect(result).toBe(true);
  });

  it("updateContent on soft-deleted returns false", async () => {
    const post = await createDraftPost();
    await repo.publishDraft(post.id, authorId);
    await repo.softDeletePost(post.id, adminId);

    post.updateContent({ title: "Should not apply" });
    const result = await repo.updateContent(post);
    expect(result).toBe(false);
  });
});

describe("PostRepository — concurrency", () => {
  it("two concurrent publishDraft: only one wins", async () => {
    const post = await createDraftPost();

    const [r1, r2] = await Promise.all([
      repo.publishDraft(post.id, authorId),
      repo.publishDraft(post.id, authorId),
    ]);

    expect(r1 || r2).toBe(true);
    expect(r1 && r2).toBe(false);

    const state = await repo.findStateByIdIncludingDeleted(post.id);
    expect(state!.status).toBe("PUBLISHED");
  });

  it("concurrent archive and delete: at least one wins, consistent state", async () => {
    const post = await createDraftPost();
    await repo.publishDraft(post.id, authorId);

    const [r1, r2] = await Promise.all([
      repo.archivePublished(post.id, authorId),
      repo.softDeletePost(post.id, adminId),
    ]);

    const state = await repo.findStateByIdIncludingDeleted(post.id);
    expect(state).not.toBeNull();

    // softDeletePost allows ARCHIVED, so both may succeed
    if (r1 && r2) {
      // archive won first, then soft delete matched the archived post
      expect(state!.status).toBe("ARCHIVED");
      expect(state!.deletedAt).not.toBeNull();
    } else if (r1) {
      // only archive won
      expect(state!.status).toBe("ARCHIVED");
      expect(state!.deletedAt).toBeNull();
    } else if (r2) {
      // only soft delete won
      expect(state!.deletedAt).not.toBeNull();
      expect(state!.status).toBe("PUBLISHED");
    }
  });
});
