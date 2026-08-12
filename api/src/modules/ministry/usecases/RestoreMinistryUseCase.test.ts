import { describe, it, expect, vi, beforeEach } from "vitest";
import { RestoreMinistryUseCase } from "./RestoreMinistryUseCase";
import { Ministry } from "../domain/entities/Ministry";

function makeDeletedMinistry(overrides: Record<string, unknown> = {}) {
  return Ministry.rehydrate({
    id: "m-1",
    name: "Music Ministry",
    description: null,
    leaderId: null,
    createdAt: new Date("2020-01-10T10:00:00Z"),
    updatedAt: new Date("2026-08-01T10:00:00Z"),
    deletedAt: new Date("2026-08-01T10:00:00Z"),
    ...overrides,
  });
}

function makeSut(ministry?: Ministry | null) {
  const repo = {
    findByIdIncludingDeleted: vi.fn().mockResolvedValue(ministry ?? null),
    save: vi.fn().mockResolvedValue(undefined),
  };
  const restoreLogRepo = {
    create: vi.fn().mockResolvedValue(undefined),
  };
  const criticalSection = {
    execute: vi.fn().mockImplementation(async (_ministryId: string, op: (ctx: any) => Promise<any>) => {
      return op({
        ministryRepository: repo,
        restoreLogRepository: restoreLogRepo,
      });
    }),
  };

  const useCase = new RestoreMinistryUseCase(repo as any, criticalSection as any);

  return { useCase, repo, restoreLogRepo, criticalSection };
}

describe("RestoreMinistryUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lança RESTORE_REASON_REQUIRED se reason curto", async () => {
    const { useCase } = makeSut(makeDeletedMinistry());
    await expect(
      useCase.execute({ ministryId: "m-1", restoredById: "u-admin", reason: "ab" }),
    ).rejects.toMatchObject({ code: "RESTORE_REASON_REQUIRED" });
  });

  it("lança RESTORE_REASON_REQUIRED se reason ausente", async () => {
    const { useCase } = makeSut(makeDeletedMinistry());
    await expect(
      useCase.execute({ ministryId: "m-1", restoredById: "u-admin", reason: "" }),
    ).rejects.toMatchObject({ code: "RESTORE_REASON_REQUIRED" });
  });

  it("lança MINISTRY_NOT_FOUND se ministério não existe", async () => {
    const { useCase } = makeSut(null);
    await expect(
      useCase.execute({ ministryId: "m-x", restoredById: "u-1", reason: "motivo" }),
    ).rejects.toMatchObject({ code: "MINISTRY_NOT_FOUND" });
  });

  it("lança MINISTRY_NOT_DELETED se ministério não está deletado", async () => {
    const active = makeDeletedMinistry({ deletedAt: null });
    const { useCase } = makeSut(active);
    await expect(
      useCase.execute({ ministryId: "m-1", restoredById: "u-1", reason: "motivo" }),
    ).rejects.toMatchObject({ code: "MINISTRY_NOT_DELETED" });
  });

  it("restaura e audita com before/after de deletedAt", async () => {
    const ministry = makeDeletedMinistry();
    const { useCase, repo, restoreLogRepo } = makeSut(ministry);

    const out = await useCase.execute({
      ministryId: "m-1",
      restoredById: "u-admin",
      reason: "decisão   do presidente ",
    });

    expect(out).toEqual({ id: "m-1" });
    expect(ministry.deletedAt).toBeNull();
    expect(repo.save).toHaveBeenCalledWith(ministry);
    expect(restoreLogRepo.create).toHaveBeenCalledWith({
      ministryId: "m-1",
      restoredById: "u-admin",
      reason: "decisão   do presidente",
      changes: {
        deletedAt: {
          before: new Date("2026-08-01T10:00:00Z"),
          after: null,
        },
      },
    });
  });

  it("preserva nome e descrição no ministério restaurado", async () => {
    const ministry = makeDeletedMinistry({ name: "Kids Ministry", description: "infantil" });
    const { useCase } = makeSut(ministry);

    await useCase.execute({ ministryId: "m-1", restoredById: "u-admin", reason: "motivo" });

    expect(ministry.name).toBe("Kids Ministry");
    expect(ministry.description).toBe("infantil");
  });
});