import { ISocketServer } from "./ISocketServer";
import { NotificationDTO } from "../../modules/notification/domain/entities/Notification";
import { createLogger } from "../../shared/logger/logger";

export interface IRealtimeNotificationPublisher {
  publish(userId: string, notification: NotificationDTO): void;
}

export class RealtimeNotificationPublisher implements IRealtimeNotificationPublisher {
  private logger = createLogger("realtime-notification-publisher");

  constructor(private readonly socketServer: ISocketServer) {}

  publish(userId: string, notification: NotificationDTO): void {
    try {
      this.socketServer.emitToUser(userId, "notification", notification);
    } catch (error) {
      this.logger.warn(
        {
          operation: "realtime_notification_publish",
          notificationId: notification.id,
          errorCode: "REALTIME_PUBLISH_FAILED",
        },
        "Realtime notification could not be published",
      );
    }
  }
}
