import { INotificationRepository } from "../domain/repositories/INotificationRepository";

export type MarkAsReadInput = {
  notificationId: string;
  userId: string;
};

export type MarkAllAsReadInput = {
  userId: string;
};

export class MarkAsReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: MarkAsReadInput): Promise<void> {
    if (!input.notificationId) return;
    await this.notificationRepo.markAsRead(input.notificationId, input.userId);
  }

  async markAllAsRead(input: MarkAllAsReadInput): Promise<{ updated: number }> {
    const count = await this.notificationRepo.markAllAsRead(input.userId, new Date());
    return { updated: count };
  }
}
