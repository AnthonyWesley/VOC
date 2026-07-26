import { Notification } from "../entities/Notification";

export type PaginatedNotifications = {
  items: Notification[];
  totalCount: number;
};

export type ListNotificationsParams = {
  userId: string;
  offset?: number;
  limit?: number;
};

export interface INotificationRepository {
  create(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  findByDedupKey(userId: string, deduplicationKey: string): Promise<Notification | null>;
  list(params: ListNotificationsParams): Promise<PaginatedNotifications>;
  markAsRead(notificationId: string, userId: string): Promise<void>;
  markAllAsRead(userId: string, readAt: Date): Promise<number>;
  countUnread(userId: string): Promise<number>;
}
