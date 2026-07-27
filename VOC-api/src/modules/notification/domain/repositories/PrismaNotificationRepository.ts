import { Prisma, PrismaClient } from "@prisma/client";
import { Notification } from "../entities/Notification";
import { INotificationRepository, ListNotificationsParams, PaginatedNotifications } from "./INotificationRepository";

function toDomain(raw: Prisma.NotificationGetPayload<{}>): Notification {
  return new Notification({
    id: raw.id,
    userId: raw.userId,
    type: raw.type,
    title: raw.title,
    message: raw.message,
    payload: (raw.payload as Record<string, unknown>) ?? undefined,
    payloadVersion: raw.payloadVersion,
    deduplicationKey: raw.deduplicationKey,
    readAt: raw.readAt,
    createdAt: raw.createdAt,
  });
}

type NotificationDb = Pick<PrismaClient, "notification">;

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly db: NotificationDb) {}

  async create(notification: Notification): Promise<void> {
    await this.db.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        payload: notification.payload as Prisma.InputJsonValue,
        payloadVersion: notification.payloadVersion,
        deduplicationKey: notification.deduplicationKey,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    const data = await this.db.notification.findUnique({ where: { id } });
    if (!data) return null;
    return toDomain(data);
  }

  async findByDedupKey(userId: string, deduplicationKey: string): Promise<Notification | null> {
    const data = await this.db.notification.findUnique({
      where: { userId_deduplicationKey: { userId, deduplicationKey } },
    });
    if (!data) return null;
    return toDomain(data);
  }

  async list(params: ListNotificationsParams): Promise<PaginatedNotifications> {
    const { userId, offset = 0, limit = 10 } = params;

    const [items, totalCount] = await Promise.all([
      this.db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      this.db.notification.count({ where: { userId } }),
    ]);

    return {
      items: items.map((n) => toDomain(n as any)),
      totalCount,
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string, readAt: Date): Promise<number> {
    const result = await this.db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt },
    });
    return result.count;
  }

  async countUnread(userId: string): Promise<number> {
    return this.db.notification.count({
      where: { userId, readAt: null },
    });
  }
}
