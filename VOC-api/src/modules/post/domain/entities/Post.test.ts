import { describe, it, expect } from "vitest";
import { Post } from "./Post";

describe("Post Entity", () => {
  describe("create", () => {
    it("deve criar com status DRAFT", () => {
      const post = Post.create({
        title: "Teste",
        content: "Conteúdo",
        category: "SERMON",
        visibility: "PUBLIC",
        authorId: "u-1",
      });
      expect(post.status).toBe("DRAFT");
      expect(post.publishedAt).toBeNull();
      expect(post.firstPublishedAt).toBeNull();
      expect(post.archivedAt).toBeNull();
      expect(post.deletedAt).toBeNull();
    });

    it("deve lançar ValidationError se título for vazio", () => {
      expect(() => Post.create({ title: "", content: "c", category: "SERMON", visibility: "PUBLIC", authorId: "u-1" })).toThrow();
    });

    it("deve lançar ValidationError se content for vazio", () => {
      expect(() => Post.create({ title: "t", content: "", category: "SERMON", visibility: "PUBLIC", authorId: "u-1" })).toThrow();
    });

    it("deve lançar ValidationError se authorId for vazio", () => {
      expect(() => Post.create({ title: "t", content: "c", category: "SERMON", visibility: "PUBLIC", authorId: "" })).toThrow();
    });
  });

  describe("rehydrate", () => {
    it("deve restaurar entidade com todos os campos", () => {
      const now = new Date();
      const post = Post.rehydrate({
        id: "p-1",
        title: "Título",
        content: "Conteúdo",
        imageUrl: null,
        category: "ANNOUNCEMENT",
        visibility: "INTERNAL",
        status: "PUBLISHED",
        firstPublishedAt: now,
        publishedAt: now,
        archivedAt: null,
        deletedAt: null,
        authorId: "u-1",
        publishedById: null,
        archivedById: null,
        deletedById: null,
        createdAt: now,
        updatedAt: now,
      });
      expect(post.id).toBe("p-1");
      expect(post.status).toBe("PUBLISHED");
      expect(post.firstPublishedAt).toEqual(now);
      expect(post.publishedAt).toEqual(now);
    });
  });

  describe("updateContent", () => {
    it("deve atualizar título e conteúdo em DRAFT", () => {
      const post = Post.create({ title: "Original", content: "Original", category: "SERMON", visibility: "PUBLIC", authorId: "u-1" });
      post.updateContent({ title: "Novo", content: "Novo conteúdo" });
      expect(post.title).toBe("Novo");
      expect(post.content).toBe("Novo conteúdo");
    });

    it("deve atualizar em PUBLISHED", () => {
      const now = new Date();
      const post = Post.rehydrate({
        id: "p-1", title: "T", content: "C", imageUrl: null,
        category: "SERMON", visibility: "PUBLIC", status: "PUBLISHED",
        firstPublishedAt: now, publishedAt: now, archivedAt: null, deletedAt: null,
        authorId: "u-1", publishedById: null, archivedById: null, deletedById: null,
        createdAt: now, updatedAt: now,
      });
      post.updateContent({ title: "Atualizado" });
      expect(post.title).toBe("Atualizado");
    });

    it("deve atualizar em ARCHIVED", () => {
      const now = new Date();
      const post = Post.rehydrate({
        id: "p-1", title: "T", content: "C", imageUrl: null,
        category: "SERMON", visibility: "PUBLIC", status: "ARCHIVED",
        firstPublishedAt: now, publishedAt: now, archivedAt: now, deletedAt: null,
        authorId: "u-1", publishedById: null, archivedById: null, deletedById: null,
        createdAt: now, updatedAt: now,
      });
      post.updateContent({ title: "Preparando republicação" });
      expect(post.title).toBe("Preparando republicação");
    });

    it("deve lançar erro se post estiver deletado", () => {
      const now = new Date();
      const post = Post.rehydrate({
        id: "p-1", title: "T", content: "C", imageUrl: null,
        category: "SERMON", visibility: "PUBLIC", status: "PUBLISHED",
        firstPublishedAt: now, publishedAt: now, archivedAt: null, deletedAt: now,
        authorId: "u-1", publishedById: null, archivedById: null, deletedById: "u-1",
        createdAt: now, updatedAt: now,
      });
      expect(() => post.updateContent({ title: "X" })).toThrow();
    });

    it("não deve permitir título vazio no update", () => {
      const post = Post.create({ title: "T", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: "u-1" });
      expect(() => post.updateContent({ title: "" })).toThrow();
    });
  });
});
