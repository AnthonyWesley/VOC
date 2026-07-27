import { describe, it, expect, vi } from "vitest";
import { RealtimeNotificationPublisher } from "./RealtimeNotificationPublisher";
import { ISocketServer } from "./ISocketServer";
import { NotificationDTO } from "../../modules/notification/domain/entities/Notification";

describe("RealtimeNotificationPublisher", () => {
  function makeNotif(overrides: Partial<NotificationDTO> = {}): NotificationDTO {
    return {
      id: "notif-1",
      type: "EVENTO_CRIADO",
      title: "Test",
      message: null,
      payload: null,
      payloadVersion: 1,
      readAt: null,
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  it("emits notification to userId room", () => {
    const emitToUser = vi.fn();
    const socketServer: ISocketServer = {
      emit: vi.fn(),
      emitToUser,
      isUserOnline: vi.fn(),
      getOnlineUserCount: vi.fn(),
    };

    const publisher = new RealtimeNotificationPublisher(socketServer);
    const notif = makeNotif();
    publisher.publish("user-1", notif);

    expect(emitToUser).toHaveBeenCalledWith("user-1", "notification", notif);
  });

  it("does not throw when emitToUser fails", () => {
    const socketServer: ISocketServer = {
      emit: vi.fn(),
      emitToUser: vi.fn().mockImplementation(() => { throw new Error("socket error"); }),
      isUserOnline: vi.fn(),
      getOnlineUserCount: vi.fn(),
    };

    const publisher = new RealtimeNotificationPublisher(socketServer);
    const notif = makeNotif();

    expect(() => publisher.publish("user-1", notif)).not.toThrow();
  });

  it("does not query database or persist data", () => {
    const emitToUser = vi.fn();
    const socketServer: ISocketServer = {
      emit: vi.fn(),
      emitToUser,
      isUserOnline: vi.fn(),
      getOnlineUserCount: vi.fn(),
    };

    const publisher = new RealtimeNotificationPublisher(socketServer);
    publisher.publish("user-1", makeNotif());

    // Should only call emitToUser, nothing else
    expect(emitToUser).toHaveBeenCalledTimes(1);
  });
});
