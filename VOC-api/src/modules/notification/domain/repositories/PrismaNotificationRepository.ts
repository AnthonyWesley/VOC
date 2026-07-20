import { PrismaClient } from "@prisma/client";
import { Notification, NotificationType } from "../entities/Notification";
import { INotificationRepository, ListNotificationsParams, PaginatedNotifications } from "./INotificationRepository";

function toDomain(raw: any): Notification {
  return new Notification({ ...raw, type: raw.type as NotificationType });
}

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private prisma: PrismaClient) {}

  async save(notification: Notification): Promise<void> {
    const data = notification.toJSON();
    await this.prisma.notification.upsert({
      where: { id: data.id },
      update: {
        readAt: data.readAt,
        title: data.title,
        message: data.message,
        payload: data.payload,
      },
      create: {
        id: data.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        payload: data.payload,
        readAt: data.readAt,
        createdAt: data.createdAt,
      },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    const data = await this.prisma.notification.findUnique({ where: { id } });
    if (!data) return null;
    return toDomain(data);
  }

  async list(params: ListNotificationsParams): Promise<PaginatedNotifications> {
    const { userId, offset = 0, limit = 10 } = params;

    const [items, totalCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      items: items.map((n) => toDomain(n)),
      totalCount,
    };
  }

  async existsByTypeAndUserId(type: string, userId: string, memberId: string): Promise<boolean> {
    const count = await this.prisma.notification.count({
      where: {
        type,
        userId,
        payload: { contains: memberId },
        createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
      },
    });
    return count > 0;
  }
}
