import { describe, it, expect, vi } from "vitest";
import { CloseEventWithSummaryUseCase } from "./CloseEventWithSummaryUseCase";
import { IRealtimeNotificationPublisher } from "../../../infra/socket/RealtimeNotificationPublisher";

function makeSut(publisher: IRealtimeNotificationPublisher, createNotificationResult?: { created: boolean; notification: any } | "UNDEFINED") {
  const repo = {
    findById: vi.fn(),
    create: vi.fn(),
    saveWithAttendanceAndFinancial: vi.fn(),
    markAsFinishedIfScheduled: vi.fn(),
  };
  const criticalSection = { execute: vi.fn() };
  const writeTransaction = {
    execute: vi.fn().mockImplementation(async (cb: any) => {
      return cb({ eventRepository: repo, assignmentRepository: {}, notificationRepository: {}, categoryReader: {}, ministryReader: {} });
    }),
  };
  const adminRecipientReader = {
    findEventAdminUserIds: vi.fn().mockResolvedValue(["admin-1", "admin-2"]),
  };
  const createdResult = createNotificationResult === "UNDEFINED"
    ? undefined
    : createNotificationResult ?? { created: true, notification: { id: "n-1", type: "EVENTO_CRIADO", title: "Test", message: null, payload: null, payloadVersion: 1, readAt: null, createdAt: new Date().toISOString() } };
  const createNotification = {
    execute: vi.fn().mockResolvedValue(createdResult),
  };

  const useCase = new CloseEventWithSummaryUseCase(
    repo as any,
    criticalSection as any,
    writeTransaction as any,
    adminRecipientReader as any,
    undefined,
    createNotification as any,
    publisher,
  );

  return { useCase, repo, createNotification, publisher, adminRecipientReader };
}

describe("CloseEventWithSummaryUseCase — publisher", () => {
  it("calls publish when created=true", async () => {
    const publish = vi.fn();
    const { useCase } = makeSut({ publish }, { created: true, notification: { id: "n-1", type: "EVENTO_CRIADO", title: "T", message: null, payload: null, payloadVersion: 1, readAt: null, createdAt: new Date().toISOString() } });

    await useCase.execute({
      mode: "CREATE_CLOSED",
      event: { type: "SUNDAY_SERVICE" as const, startsAt: new Date(), title: "New Event" },
      summary: {},
    });

    expect(publish).toHaveBeenCalledWith("admin-1", expect.any(Object));
    expect(publish).toHaveBeenCalledWith("admin-2", expect.any(Object));
  });

  it("does not call publish when created=false", async () => {
    const publish = vi.fn();
    const { useCase } = makeSut({ publish }, { created: false, notification: { id: "n-1", type: "EVENTO_CRIADO", title: "T", message: null, payload: null, payloadVersion: 1, readAt: null, createdAt: new Date().toISOString() } });

    await useCase.execute({
      mode: "CREATE_CLOSED",
      event: { type: "SUNDAY_SERVICE" as const, startsAt: new Date(), title: "New Event" },
      summary: {},
    });

    expect(publish).not.toHaveBeenCalled();
  });

  it("does not call publish when createNotification returns undefined", async () => {
    const publish = vi.fn();
    const { useCase } = makeSut({ publish }, "UNDEFINED");

    await useCase.execute({
      mode: "CREATE_CLOSED",
      event: { type: "SUNDAY_SERVICE" as const, startsAt: new Date(), title: "New Event" },
      summary: {},
    });

    expect(publish).not.toHaveBeenCalled();
  });
});
