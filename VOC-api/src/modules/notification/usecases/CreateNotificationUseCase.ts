import { generateId } from "../../../shared/utils/generateId";
import { Notification, NotificationType } from "../domain/entities/Notification";
import { INotificationRepository } from "../domain/repositories/INotificationRepository";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  payload?: Record<string, unknown>;
};

export class CreateNotificationUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: CreateNotificationInput): Promise<Notification> {
    const notification = new Notification({
      id: generateId(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      payload: input.payload ? JSON.stringify(input.payload) : undefined,
      readAt: null,
      createdAt: new Date(),
    });

    await this.notificationRepo.save(notification);
    return notification;
  }
}
