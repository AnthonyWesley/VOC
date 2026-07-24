import { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/NotFoundError";

export type MarkAsReadInput = {
  notificationId: string;
  userId: string;
};

export class MarkAsReadUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: MarkAsReadInput): Promise<void> {
    if (!input.notificationId) throw new NotFoundError("NOTIFICATION_NOT_FOUND");

    await this.prisma.notification.updateMany({
      where: {
        id: input.notificationId,
        userId: input.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }
}
