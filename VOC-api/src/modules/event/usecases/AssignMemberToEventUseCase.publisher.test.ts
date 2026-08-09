import { describe, it, expect, vi } from "vitest";
import { AssignMemberToEventUseCase } from "./AssignMemberToEventUseCase";
import { IRealtimeNotificationPublisher } from "../../../infra/socket/RealtimeNotificationPublisher";

function mockWhatsApp() {
  return { sendMessage: vi.fn().mockResolvedValue({ ok: false, code: "NOT_CONFIGURED", retryable: false }) };
}

function makeSut(publisher: IRealtimeNotificationPublisher, createNotificationResult?: { created: boolean; notification: any } | "UNDEFINED") {
  const eventRepo = {
    assignAssignment: vi.fn(),
    findAssignment: vi.fn(),
    assignMember: vi.fn(),
    findMemberAttendance: vi.fn(),
    findById: vi.fn(),
  };
  const assignmentLookup = {
    find: vi.fn(),
    create: vi.fn(),
  };
  const criticalSection = {
    execute: vi.fn().mockImplementation(async (_eventId: string, callback: any) => {
      const mockEventRepo = {
        assignMember: vi.fn(),
        findById: vi.fn().mockResolvedValue({ id: "event-1", title: "Test", type: "SUNDAY_SERVICE", startsAt: new Date(), status: "SCHEDULED", isDeleted: false }),
      };
      const mockAssignmentRepo = {
        create: vi.fn().mockResolvedValue({ id: "assignment-1", eventId: "event-1", memberId: "member-1", ministryId: "ministry-1", assignedAt: new Date() }),
        find: vi.fn(),
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
      return callback({ eventRepository: mockEventRepo, assignmentRepository: mockAssignmentRepo, notificationRepository: mockNotificationRepo, categoryReader: {} as any, ministryReader: {} as any });
    }),
  };
  const prisma = {
    member: { findUnique: vi.fn().mockResolvedValue({ id: "member-1", fullName: "John", userId: "user-1", phone: "5511999999999" }) },
    user: { findUnique: vi.fn().mockResolvedValue({ id: "user-admin", member: null }) },
    ministry: { findUnique: vi.fn().mockResolvedValue({ id: "ministry-1", name: "Music", leaderId: "leader-1" }) },
  };
  const createdResult = createNotificationResult === "UNDEFINED"
    ? undefined
    : createNotificationResult ?? { created: true, notification: { id: "n-1", type: "MEMBRO_ESCALADO", title: "T", message: null, payload: null, payloadVersion: 1, readAt: null, createdAt: new Date().toISOString() } };
  const createNotification = {
    execute: vi.fn().mockResolvedValue(createdResult),
  };

  const useCase = new AssignMemberToEventUseCase(
    eventRepo as any,
    assignmentLookup as any,
    criticalSection as any,
    createNotification as any,
    prisma as any,
    mockWhatsApp() as any,
    publisher,
  );

  return { useCase, eventRepo, createNotification, publisher, criticalSection };
}

describe("AssignMemberToEventUseCase — publisher", () => {
  it("calls publish when created=true", async () => {
    const publish = vi.fn();
    const { useCase } = makeSut({ publish }, { created: true, notification: { id: "n-1", type: "MEMBRO_ESCALADO", title: "T", message: null, payload: null, payloadVersion: 1, readAt: null, createdAt: new Date().toISOString() } });

    await useCase.execute({
      eventId: "event-1",
      memberId: "member-1",
      ministryId: "ministry-1",
      userId: "admin-1",
      userLevel: 100,
    });

    expect(publish).toHaveBeenCalledWith("user-1", expect.any(Object));
  });

  it("does not call publish when created=false", async () => {
    const publish = vi.fn();
    const { useCase } = makeSut({ publish }, { created: false, notification: { id: "n-1", type: "MEMBRO_ESCALADO", title: "T", message: null, payload: null, payloadVersion: 1, readAt: null, createdAt: new Date().toISOString() } });

    await useCase.execute({
      eventId: "event-1",
      memberId: "member-1",
      ministryId: "ministry-1",
      userId: "admin-1",
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
      ministryId: "ministry-1",
      userId: "admin-1",
      userLevel: 100,
    });

    expect(publish).not.toHaveBeenCalled();
  });
});
