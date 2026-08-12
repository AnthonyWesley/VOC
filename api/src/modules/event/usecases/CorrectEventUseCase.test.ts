import { describe, it, expect, vi, beforeEach } from "vitest";
import { CorrectEventUseCase } from "./CorrectEventUseCase";
import { Event } from "../domain/entities/Event";

function makeFinishedEvent(overrides: Record<string, unknown> = {}) {
  return Event.rehydrate({
    id: "ev-1",
    title: "Test",
    type: "SUNDAY_SERVICE",
    status: "FINISHED",
    startsAt: new Date("2026-08-02T08:00:00Z"),
    endsAt: new Date("2026-08-02T10:00:00Z"),
    preacherId: null,
    theme: "old-theme",
    notes: "old-notes",
    needsScale: false,
    attendanceMode: "SUMMARY",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function makeSut(event?: Event | null, options: { attendance?: any; members?: any } = {}) {
  const repo = {
    findById: vi.fn().mockResolvedValue(event ?? null),
    findAttendance: vi.fn().mockResolvedValue(options.attendance ?? null),
    saveWithAttendanceAndFinancial: vi.fn(),
  };
  const correctionRepo = {
    create: vi.fn().mockResolvedValue(undefined),
  };
  const memberReader = {
    findById: vi.fn().mockResolvedValue(options.members ?? null),
  };
  const criticalSection = {
    execute: vi.fn().mockImplementation(async (_eventId: string, op: (ctx: any) => Promise<any>) => {
      return op({
        eventRepository: repo,
        correctionRepository: correctionRepo,
        memberReader,
        assignmentRepository: {},
        notificationRepository: {},
        categoryReader: {},
        ministryReader: {},
      });
    }),
  };

  const useCase = new CorrectEventUseCase(repo as any, criticalSection as any);

  return { useCase, repo, correctionRepo, memberReader, criticalSection };
}

describe("CorrectEventUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lança CORRECTION_REASON_REQUIRED se reason curto", async () => {
    const { useCase } = makeSut(makeFinishedEvent());
    await expect(
      useCase.execute({ eventId: "ev-1", correctedById: "u-1", reason: "ab" }),
    ).rejects.toMatchObject({ code: "CORRECTION_REASON_REQUIRED" });
  });

  it("lança EVENT_NOT_FOUND se evento não existe", async () => {
    const { useCase } = makeSut(null);
    await expect(
      useCase.execute({ eventId: "ev-1", correctedById: "u-1", reason: "motivo", theme: "x" }),
    ).rejects.toMatchObject({ code: "EVENT_NOT_FOUND" });
  });

  it("lança EVENT_DELETED se evento deletado", async () => {
    const event = Event.rehydrate({
      id: "ev-1", title: "T", type: "SUNDAY_SERVICE", status: "FINISHED",
      startsAt: new Date(), endsAt: new Date(), preacherId: null, theme: null, notes: null,
      needsScale: false, attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date(),
      deletedAt: new Date(), deletedById: "u-1", deleteReason: "x",
    });
    const { useCase } = makeSut(event);
    await expect(
      useCase.execute({ eventId: "ev-1", correctedById: "u-1", reason: "motivo", theme: "x" }),
    ).rejects.toMatchObject({ code: "EVENT_DELETED" });
  });

  it("lança EVENT_NOT_FINISHED se não estiver FINISHED", async () => {
    const event = makeFinishedEvent({ status: "SCHEDULED" });
    const { useCase } = makeSut(event);
    await expect(
      useCase.execute({ eventId: "ev-1", correctedById: "u-1", reason: "motivo", theme: "x" }),
    ).rejects.toMatchObject({ code: "EVENT_NOT_FINISHED" });
  });

  it("lança PREACHER_NOT_FOUND se preacher não existe", async () => {
    const { useCase } = makeSut(makeFinishedEvent(), { members: null });
    await expect(
      useCase.execute({ eventId: "ev-1", correctedById: "u-1", reason: "motivo", preacherId: "m-x" }),
    ).rejects.toMatchObject({ code: "PREACHER_NOT_FOUND" });
  });

  it("lança INDIVIDUAL_ATTENDANCE_COUNTS_ARE_DERIVED no modo INDIVIDUAL", async () => {
    const event = makeFinishedEvent({ attendanceMode: "INDIVIDUAL" });
    const { useCase } = makeSut(event);
    await expect(
      useCase.execute({ eventId: "ev-1", correctedById: "u-1", reason: "motivo", membersCount: 10 }),
    ).rejects.toMatchObject({ code: "INDIVIDUAL_ATTENDANCE_COUNTS_ARE_DERIVED" });
  });

  it("lança NO_CHANGES_DETECTED se nada mudou", async () => {
    const { useCase } = makeSut(makeFinishedEvent());
    await expect(
      useCase.execute({ eventId: "ev-1", correctedById: "u-1", reason: "motivo", theme: "old-theme" }),
    ).rejects.toMatchObject({ code: "NO_CHANGES_DETECTED" });
  });

  it("corrige theme/notes e grava EventCorrection", async () => {
    const { useCase, repo, correctionRepo } = makeSut(makeFinishedEvent());
    const out = await useCase.execute({
      eventId: "ev-1", correctedById: "u-user", reason: "motivo", theme: "new-theme", notes: "new-notes",
    });

    expect(out).toEqual({ id: "ev-1", corrections: 2 });
    const saved = repo.saveWithAttendanceAndFinancial.mock.calls[0][0];
    expect(saved.theme).toBe("new-theme");
    expect(saved.notes).toBe("new-notes");
    expect(correctionRepo.create).toHaveBeenCalledWith({
      eventId: "ev-1",
      correctedById: "u-user",
      reason: "motivo",
      changes: {
        theme: { before: "old-theme", after: "new-theme" },
        notes: { before: "old-notes", after: "new-notes" },
      },
    });
  });

  it("corrige membersCount e visitorsCount (upsert) no modo SUMMARY", async () => {
    const { useCase, repo, correctionRepo } = makeSut(makeFinishedEvent());
    const out = await useCase.execute({
      eventId: "ev-1", correctedById: "u-1", reason: "motivo", membersCount: 50, visitorsCount: 20,
    });

    expect(out).toEqual({ id: "ev-1", corrections: 2 });
    expect(repo.saveWithAttendanceAndFinancial).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      eventId: "ev-1", membersCount: 50, visitorsCount: 20,
    }));
    expect(correctionRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      changes: {
        membersCount: { before: 0, after: 50 },
        visitorsCount: { before: 0, after: 20 },
      },
    }));
  });

  it("valida preacher se informado", async () => {
    const { useCase, memberReader } = makeSut(makeFinishedEvent(), {
      members: { id: "m-1", fullName: "Preacher" },
    });
    const out = await useCase.execute({
      eventId: "ev-1", correctedById: "u-1", reason: "motivo", preacherId: "m-1", theme: "novo",
    });

    expect(memberReader.findById).toHaveBeenCalledWith("m-1");
    expect(out).toEqual({ id: "ev-1", corrections: 2 });
  });
});