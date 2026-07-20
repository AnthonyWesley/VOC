import { INotificationRepository } from "../domain/repositories/INotificationRepository";

export class MarkAsReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(notificationId: string): Promise<void> {
    const notification = await this.notificationRepo.findById(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    notification.markAsRead();
    await this.notificationRepo.save(notification);
  }
}
