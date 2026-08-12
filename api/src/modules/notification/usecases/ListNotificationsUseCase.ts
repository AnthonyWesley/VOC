import { INotificationRepository, PaginatedNotifications } from "../domain/repositories/INotificationRepository";

export type ListNotificationsInput = {
  userId: string;
  offset?: number;
  limit?: number;
};

export class ListNotificationsUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: ListNotificationsInput): Promise<PaginatedNotifications> {
    return this.notificationRepo.list({
      userId: input.userId,
      offset: input.offset ?? 0,
      limit: Math.min(Math.max(input.limit ?? 10, 1), 50),
    });
  }
}
