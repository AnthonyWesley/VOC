import { describe, it, expect, vi } from "vitest";
import { RemoveMemberFromEventUseCase } from "./RemoveMemberFromEventUseCase";
import { IRealtimeNotificationPublisher } from "../../../infra/socket/RealtimeNotificationPublisher";

function mockWhatsApp() {
  return { sendMessage: vi.fn().mockResolvedValue({ ok: false, code: "NOT_CONFIGURED", retryable: false }) };
}

function makeSut(publisher: IRealtimeNotificationPublisher, createNotificationResult?: { created: boolean; notification: any } | "UNDEFINED") {
  const repo = {
    findById: vi.fn(),
    removeAssignment: vi.fn(),
    removeMember: vi.fn(),
  };
  const criticalSection = {
    execute: vi.fn().mockImplementation(async (_eventId: string, callback: any) => {
      const mockEventRepo = {
        findById: vi.fn().mockResolvedValue({ id: "event-1", status: "SCHEDULED", title: "Test", type: "SUNDAY_SERVICE", startsAt: new Date(), isDeleted: false }),
        removeAssignment: vi.fn(),
        removeMember: vi.fn(),
      };
      const mockNotificationRepo = {
        create: vi.fn(),
        findById: vi.fn(),
        findByDedupKey: vi.fn(),
        list: vi.fn(),
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        countUnread: vi.fn(),
      };
      return callback({ eventRepository: mockEventRepo, assignmentRepository: {} as any, notificationRepository: mockNotificationRepo, categoryReader: {} as any, ministryReader: { findById: vi.fn().mockResolvedValue({ id: "ministry-1", name: "Music" }) as any } });
    }),
  };
  const prisma = {
    eventAssignment: {
      findUnique: vi.fn().mockResolvedValue({ id: "assignment-1", ministryId: "ministry-1" }),
    },
    event: {
      findUnique: vi.fn().mockResolvedValue({ id: "event-1", title: "Test", type: "SUNDAY_SERVICE", startsAt: new Date() }),
    },
    member: {
      findUnique: vi.fn().mockResolvedValue({ id: "member-1", fullName: "John", userId: "user-1", phone: "5511999999999" }),
    },
    ministry: {
      findUnique: vi.fn().mockResolvedValue({ id: "ministry-1", name: "Music", leaderId: "leader-1" }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: "user-admin", member: { id: "member-admin" } }),
    },
  } as any;
  const createdResult = createNotificationResult === "UNDEFINED"
    ? undefined
    : createNotificationResult ?? { created: true, notification: { id: "n-1", type: "MEMBRO_REMOVIDO", title: "T", message: null, payload: null, payloadVersion: 1, readAt: null, createdAt: new Date().toISOString() } };
  const createNotification = {
    execute: vi.fn().mockResolvedValue(createdResult),
  };

  const useCase = new RemoveMemberFromEventUseCase(
    repo as any,
    criticalSection as any,
    prisma,
    undefined,
    createNotification as any,
    mockWhatsApp() as any,
    publisher,
  );

  return { useCase, repo, createNotification, publisher, criticalSection };
}

describe("RemoveMemberFromEventUseCase — publisher", () => {
  it("calls publish when created=true", async () => {
    const publish = vi.fn();
    const { useCase } = makeSut({ publish }, { created: true, notification: { id: "n-1", type: "MEMBRO_REMOVIDO", title: "T", message: null, payload: null, payloadVersion: 1, readAt: null, createdAt: new Date().toISOString() } });

    await useCase.execute({
      eventId: "event-1",
      memberId: "member-1",
      assignmentId: "assignment-1",
      userId: "user-admin",
      userLevel: 100,
    });

    expect(publish).toHaveBeenCalledWith("user-1", expect.any(Object));
  });

  it("does not call publish when created=false", async () => {
    const publish = vi.fn();
    const { useCase } = makeSut({ publish }, { created: false, notification: { id: "n-1", type: "MEMBRO_REMOVIDO", title: "T", message: null, payload: null, payloadVersion: 1, readAt: null, createdAt: new Date().toISOString() } });

    await useCase.execute({
      eventId: "event-1",
      memberId: "member-1",
      assignmentId: "assignment-1",
      userId: "user-admin",
      userLevel: 100,
    });

    expect(publish).not.toHaveBeenCalled();
  });

  it("does not call publish when createNotification returns undefined", async () => {
    const publish = vi.fn();
    const { useCase } = makeSut({ publish }, "UNDEFINED");

    await useCase.execute({
      eventId: "event-1",
      memberId: "member-1",
      assignmentId: "assignment-1",
      userId: "user-admin",
      userLevel: 100,
    });

    expect(publish).not.toHaveBeenCalled();
  });
});
