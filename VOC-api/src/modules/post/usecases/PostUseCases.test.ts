import { describe, it, expect, vi, beforeEach } from "vitest";
import { Post } from "../domain/entities/Post";
import { CreatePostUseCase } from "../usecases/CreatePostUseCase";
import { PublishPostUseCase } from "../usecases/PublishPostUseCase";
import { ArchivePostUseCase } from "../usecases/ArchivePostUseCase";
import { DeletePostUseCase } from "../usecases/DeletePostUseCase";
import { UpdatePostUseCase } from "../usecases/UpdatePostUseCase";

const mockRepo = () => ({
  findById: vi.fn(),
  findDetails: vi.fn(),
  findAll: vi.fn(),
  findAllPublic: vi.fn(),
  create: vi.fn(),
  updateContent: vi.fn(),
  publishDraft: vi.fn(),
  republishArchived: vi.fn(),
  archivePublished: vi.fn(),
  hardDeleteDraft: vi.fn(),
  softDeletePost: vi.fn(),
  findStateByIdIncludingDeleted: vi.fn(),
});

const mockUserRepo = () => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  save: vi.fn(),
});

function makeDraft() {
  return Post.create({ title: "T", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: "u-1" });
}

function makePublished() {
  const now = new Date();
  return Post.rehydrate({
    id: "p-1", title: "T", content: "C", imageUrl: null,
    category: "SERMON", visibility: "PUBLIC", status: "PUBLISHED",
    firstPublishedAt: now, publishedAt: now, archivedAt: null, deletedAt: null,
    authorId: "u-1", publishedById: "u-1", archivedById: null, deletedById: null,
    createdAt: now, updatedAt: now,
  });
}

function makeArchived() {
  const now = new Date();
  return Post.rehydrate({
    id: "p-1", title: "T", content: "C", imageUrl: null,
    category: "SERMON", visibility: "PUBLIC", status: "ARCHIVED",
    firstPublishedAt: now, publishedAt: now, archivedAt: now, deletedAt: null,
    authorId: "u-1", publishedById: "u-1", archivedById: "u-1", deletedById: null,
    createdAt: now, updatedAt: now,
  });
}

describe("CreatePostUseCase", () => {
  it("deve criar post como DRAFT", async () => {
    const repo = mockRepo();
    const uc = new CreatePostUseCase(repo as any);
    const result = await uc.execute({ title: "T", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: "u-1" });
    expect(result.id).toBeTruthy();
    expect(repo.create).toHaveBeenCalledOnce();
    const saved = repo.create.mock.calls[0][0] as Post;
    expect(saved.status).toBe("DRAFT");
  });
});

describe("PublishPostUseCase", () => {
  beforeEach(() => vi.clearAllMocks());

  it("DRAFT → PUBLISHED via publishDraft", async () => {
    const repo = mockRepo();
    const userRepo = mockUserRepo();
    repo.findById.mockResolvedValue(makeDraft());
    repo.publishDraft.mockResolvedValue(true);
    userRepo.findById.mockResolvedValue({ highestLevel: 100 });

    const uc = new PublishPostUseCase(repo as any, userRepo as any);
    const result = await uc.execute({ postId: "p-1", visibility: "PUBLIC", authUserId: "u-1" });
    expect(result.id).toBe("p-1");
    expect(repo.publishDraft).toHaveBeenCalledWith("p-1", "u-1");
  });

  it("ARCHIVED → PUBLISHED via republishArchived", async () => {
    const repo = mockRepo();
    const userRepo = mockUserRepo();
    repo.findById.mockResolvedValue(makeArchived());
    repo.republishArchived.mockResolvedValue(true);
    userRepo.findById.mockResolvedValue({ highestLevel: 100 });

    const uc = new PublishPostUseCase(repo as any, userRepo as any);
    await uc.execute({ postId: "p-1", visibility: "PUBLIC", authUserId: "u-1" });
    expect(repo.republishArchived).toHaveBeenCalledWith("p-1", "u-1");
  });

  it("PUBLISHED → erro ConflictError", async () => {
    const repo = mockRepo();
    const userRepo = mockUserRepo();
    repo.findById.mockResolvedValue(makePublished());
    userRepo.findById.mockResolvedValue({ highestLevel: 100 });

    const uc = new PublishPostUseCase(repo as any, userRepo as any);
    await expect(uc.execute({ postId: "p-1", visibility: "PUBLIC", authUserId: "u-1" })).rejects.toMatchObject({ code: "POST_ALREADY_PUBLISHED" });
  });

  it("CAS retorna false → diagnóstico com findStateByIdIncludingDeleted", async () => {
    const repo = mockRepo();
    const userRepo = mockUserRepo();
    repo.findById.mockResolvedValue(makeDraft());
    repo.publishDraft.mockResolvedValue(false);
    repo.findStateByIdIncludingDeleted.mockResolvedValue({ status: "DRAFT", deletedAt: null, firstPublishedAt: null });
    userRepo.findById.mockResolvedValue({ highestLevel: 100 });

    const uc = new PublishPostUseCase(repo as any, userRepo as any);
    await expect(uc.execute({ postId: "p-1", visibility: "PUBLIC", authUserId: "u-1" })).rejects.toMatchObject({ code: "POST_CANNOT_BE_PUBLISHED" });
  });

  it("post deletado → 404", async () => {
    const repo = mockRepo();
    const userRepo = mockUserRepo();
    repo.findById.mockResolvedValue(null);

    const uc = new PublishPostUseCase(repo as any, userRepo as any);
    await expect(uc.execute({ postId: "p-1", visibility: "PUBLIC", authUserId: "u-1" })).rejects.toMatchObject({ code: "POST_NOT_FOUND" });
  });
});

describe("ArchivePostUseCase", () => {
  it("PUBLISHED → ARCHIVED via archivePublished", async () => {
    const repo = mockRepo();
    const userRepo = mockUserRepo();
    repo.findById.mockResolvedValue(makePublished());
    repo.archivePublished.mockResolvedValue(true);
    userRepo.findById.mockResolvedValue({ highestLevel: 100 });

    const uc = new ArchivePostUseCase(repo as any, userRepo as any);
    const result = await uc.execute({ postId: "p-1", authUserId: "u-1" });
    expect(result.id).toBe("p-1");
    expect(repo.archivePublished).toHaveBeenCalledWith("p-1", "u-1");
  });

  it("DRAFT → erro ConflictError", async () => {
    const repo = mockRepo();
    const userRepo = mockUserRepo();
    repo.findById.mockResolvedValue(makeDraft());
    userRepo.findById.mockResolvedValue({ highestLevel: 100 });

    const uc = new ArchivePostUseCase(repo as any, userRepo as any);
    await expect(uc.execute({ postId: "p-1", authUserId: "u-1" })).rejects.toMatchObject({ code: "ONLY_PUBLISHED_CAN_BE_ARCHIVED" });
  });
});

describe("DeletePostUseCase", () => {
  it("DRAFT → hardDeleteDraft", async () => {
    const repo = mockRepo();
    const userRepo = mockUserRepo();
    repo.findById.mockResolvedValue(makeDraft());
    repo.hardDeleteDraft.mockResolvedValue(true);
    userRepo.findById.mockResolvedValue({ highestLevel: 100 });

    const uc = new DeletePostUseCase(repo as any, userRepo as any);
    await uc.execute({ postId: "p-1", authUserId: "u-1" });
    expect(repo.hardDeleteDraft).toHaveBeenCalledWith("p-1");
  });

  it("PUBLISHED → softDeletePost", async () => {
    const repo = mockRepo();
    const userRepo = mockUserRepo();
    repo.findById.mockResolvedValue(makePublished());
    repo.softDeletePost.mockResolvedValue(true);
    userRepo.findById.mockResolvedValue({ highestLevel: 100 });

    const uc = new DeletePostUseCase(repo as any, userRepo as any);
    await uc.execute({ postId: "p-1", authUserId: "u-1" });
    expect(repo.softDeletePost).toHaveBeenCalledWith("p-1", "u-1");
  });

  it("ARCHIVED → softDeletePost", async () => {
    const repo = mockRepo();
    const userRepo = mockUserRepo();
    repo.findById.mockResolvedValue(makeArchived());
    repo.softDeletePost.mockResolvedValue(true);
    userRepo.findById.mockResolvedValue({ highestLevel: 100 });

    const uc = new DeletePostUseCase(repo as any, userRepo as any);
    await uc.execute({ postId: "p-1", authUserId: "u-1" });
    expect(repo.softDeletePost).toHaveBeenCalledWith("p-1", "u-1");
  });
});

describe("UpdatePostUseCase", () => {
  it("deve atualizar conteúdo com updateContent", async () => {
    const repo = mockRepo();
    const userRepo = mockUserRepo();
    const draft = makeDraft();
    repo.findById.mockResolvedValue(draft);
    repo.updateContent.mockResolvedValue(true);
    userRepo.findById.mockResolvedValue({ highestLevel: 100 });

    const uc = new UpdatePostUseCase(repo as any, userRepo as any);
    const result = await uc.execute({ postId: draft.id, title: "Novo título", authUserId: "u-1" });
    expect(result.id).toBe(draft.id);
    expect(repo.updateContent).toHaveBeenCalledOnce();
  });
});
