import { describe, it, expect } from "vitest";
import { Notification } from "../../domain/entities/Notification";

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    id: "n-test-1",
    userId: "u-test-1",
    type: "EVENTO_CRIADO" as const,
    title: "Test notification",
    message: "Test message",
    payload: { eventId: "evt-1" },
    payloadVersion: 1,
    deduplicationKey: null,
    readAt: null,
    createdAt: new Date("2026-07-26T10:00:00Z"),
    ...overrides,
  };
}

describe("Notification Entity", () => {
  it("creates with all props", () => {
    const n = new Notification(makeProps());
    expect(n.id).toBe("n-test-1");
    expect(n.userId).toBe("u-test-1");
    expect(n.type).toBe("EVENTO_CRIADO");
    expect(n.title).toBe("Test notification");
    expect(n.message).toBe("Test message");
    expect(n.payload).toEqual({ eventId: "evt-1" });
    expect(n.payloadVersion).toBe(1);
    expect(n.deduplicationKey).toBeNull();
    expect(n.readAt).toBeNull();
    expect(n.isRead).toBe(false);
  });

  it("returns null for optional fields when not set", () => {
    const n = new Notification(makeProps({ message: undefined, payload: undefined, deduplicationKey: undefined }));
    expect(n.message).toBeNull();
    expect(n.payload).toBeNull();
    expect(n.deduplicationKey).toBeNull();
  });

  it("markAsRead sets readAt", () => {
    const n = new Notification(makeProps());
    expect(n.isRead).toBe(false);
    n.markAsRead();
    expect(n.readAt).toBeInstanceOf(Date);
    expect(n.isRead).toBe(true);
  });

  it("toDTO returns correct shape", () => {
    const n = new Notification(makeProps());
    n.markAsRead();
    const dto = n.toDTO();
    expect(dto).toEqual({
      id: "n-test-1",
      type: "EVENTO_CRIADO",
      title: "Test notification",
      message: "Test message",
      payload: { eventId: "evt-1" },
      payloadVersion: 1,
      readAt: expect.any(String),
      createdAt: "2026-07-26T10:00:00.000Z",
    });
  });

  it("toDTO returns null readAt when unread", () => {
    const n = new Notification(makeProps());
    const dto = n.toDTO();
    expect(dto.readAt).toBeNull();
  });
});
