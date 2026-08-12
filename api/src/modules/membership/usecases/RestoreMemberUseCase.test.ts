import { describe, it, expect, vi, beforeEach } from "vitest";
import { RestoreMemberUseCase } from "./RestoreMemberUseCase";
import { Member } from "../domain/entities/Member";

function makeDeletedMember(overrides: Record<string, unknown> = {}) {
  return Member.rehydrate({
    id: "m-1",
    fullName: "Test Member",
    normalizedFullName: "test member",
    birthDate: new Date("1990-05-20"),
    churchJoinDate: new Date("2020-01-10"),
    status: "INACTIVE",
    userId: "u-1",
    createdAt: new Date("2020-01-10T10:00:00Z"),
    updatedAt: new Date("2026-08-01T10:00:00Z"),
    deletedAt: new Date("2026-08-01T10:00:00Z"),
    ...overrides,
  });
}

function makeSut(member?: Member | null) {
  const repo = {
    findByIdIncludingDeleted: vi.fn().mockResolvedValue(member ?? null),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
  };
  const restoreLogRepo = {
    create: vi.fn().mockResolvedValue(undefined),
  };
  const criticalSection = {
    execute: vi.fn().mockImplementation(async (_memberId: string, op: (ctx: any) => Promise<any>) => {
      return op({
        memberRepository: repo,
        restoreLogRepository: restoreLogRepo,
      });
    }),
  };

  const useCase = new RestoreMemberUseCase(repo as any, criticalSection as any);

  return { useCase, repo, restoreLogRepo, criticalSection };
}

describe("RestoreMemberUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lança RESTORE_REASON_REQUIRED se reason curto", async () => {
    const { useCase } = makeSut(makeDeletedMember());
    await expect(
      useCase.execute({ memberId: "m-1", restoredById: "u-admin", reason: "ab" }),
    ).rejects.toMatchObject({ code: "RESTORE_REASON_REQUIRED" });
  });

  it("lança RESTORE_REASON_REQUIRED se reason ausente", async () => {
    const { useCase } = makeSut(makeDeletedMember());
    await expect(
      useCase.execute({ memberId: "m-1", restoredById: "u-admin", reason: "" }),
    ).rejects.toMatchObject({ code: "RESTORE_REASON_REQUIRED" });
  });

  it("lança MEMBER_NOT_FOUND se membro não existe", async () => {
    const { useCase } = makeSut(null);
    await expect(
      useCase.execute({ memberId: "m-x", restoredById: "u-1", reason: "motivo" }),
    ).rejects.toMatchObject({ code: "MEMBER_NOT_FOUND" });
  });

  it("lança MEMBER_NOT_DELETED se membro não está deletado", async () => {
    const active = makeDeletedMember({ deletedAt: null });
    const { useCase } = makeSut(active);
    await expect(
      useCase.execute({ memberId: "m-1", restoredById: "u-1", reason: "motivo" }),
    ).rejects.toMatchObject({ code: "MEMBER_NOT_DELETED" });
  });

  it("restaura e audita com before/after de deletedAt", async () => {
    const member = makeDeletedMember();
    const { useCase, repo, restoreLogRepo } = makeSut(member);

    const out = await useCase.execute({
      memberId: "m-1",
      restoredById: "u-admin",
      reason: "decisão   do presidente ",
    });

    expect(out).toEqual({ id: "m-1" });
    expect(member.deletedAt).toBeNull();
    expect(repo.save).toHaveBeenCalledWith(member);
    expect(restoreLogRepo.create).toHaveBeenCalledWith({
      memberId: "m-1",
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

  it("preserva status e userId no membro restaurado", async () => {
    const member = makeDeletedMember();
    const { useCase } = makeSut(member);

    await useCase.execute({ memberId: "m-1", restoredById: "u-admin", reason: "motivo" });

    expect(member.status).toBe("INACTIVE");
    expect(member.userId).toBe("u-1");
  });
});