import { generateId } from "../../../shared/utils/generateId";
import { Notification, NotificationDTO, NotificationType } from "../domain/entities/Notification";
import { INotificationRepository } from "../domain/repositories/INotificationRepository";
import { validateNotificationPayload } from "../domain/validation/notificationPayloadSchemas";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  payload?: Record<string, unknown>;
  deduplicationKey?: string;
};

export type CreateNotificationResult = {
  notification: NotificationDTO;
  created: boolean;
};

export type CreateNotificationOptions = {
  repository?: INotificationRepository;
  recoverDeduplicationConflict?: boolean;
};

export class CreateNotificationUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(
    input: CreateNotificationInput,
    options: CreateNotificationOptions = {},
  ): Promise<CreateNotificationResult> {
    const repo = options.repository ?? this.notificationRepo;
    const recoverDeduplicationConflict = options.recoverDeduplicationConflict ?? true;

    const validatedPayload = input.payload
      ? validateNotificationPayload(input.type, input.payload)
      : null;

    const notification = new Notification({
      id: generateId(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      payload: validatedPayload,
      payloadVersion: 1,
      deduplicationKey: input.deduplicationKey,
      readAt: null,
      createdAt: new Date(),
    });

    if (input.deduplicationKey && recoverDeduplicationConflict) {
      try {
        await repo.create(notification);
        return { notification: notification.toDTO(), created: true };
      } catch (err: any) {
        if (err.code === "P2002") {
          const existing = await repo.findByDedupKey(input.userId, input.deduplicationKey);
          if (existing) {
            return { notification: existing.toDTO(), created: false };
          }
        }
        throw err;
      }
    }

    await repo.create(notification);
    return { notification: notification.toDTO(), created: true };
  }
}
