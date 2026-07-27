import { describe, it, expect, vi } from "vitest";
import { AssignMemberToEventUseCase } from "./AssignMemberToEventUseCase";
import { IRealtimeNotificationPublisher } from "../../../infra/socket/RealtimeNotificationPublisher";

function mockWhatsApp() {
  return { sendMessage: vi.fn().mockResolvedValue({ ok: false, code: "NOT_CONFIGURED", retryable: false }) };
}

function makeSut(publisher: IRealtimeNotificationPublisher, createNotificationResult?: { created: boolean; notification: any } | "UNDEFINED") {
  const repo = {
    assignAssignment: vi.fn(),
    findAssignment: vi.fn().mockResolvedValue({ id: "assignment-1" }),
    assignMember: vi.fn(),
    findMemberAttendance: vi.fn(),
  };
  const prisma = {
    event: { findUnique: vi.fn().mockResolvedValue({ id: "event-1", title: "Test", type: "SUNDAY_SERVICE", startsAt: new Date(), status: "ACTIVE" }) },
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
    repo as any,
    prisma as any,
    undefined,
    createNotification as any,
    mockWhatsApp() as any,
    publisher,
  );

  return { useCase, repo, createNotification, publisher };
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

    // Flush setImmediate from the use case
    await new Promise<void>((resolve) => setImmediate(() => resolve()));

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
