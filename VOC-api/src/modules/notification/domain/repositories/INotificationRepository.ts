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
  save(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  list(params: ListNotificationsParams): Promise<PaginatedNotifications>;
  existsByTypeAndUserId(type: string, userId: string, memberId: string): Promise<boolean>;
}
