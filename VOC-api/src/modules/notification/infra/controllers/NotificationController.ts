import { Request, Response } from "express";
import { ListNotificationsUseCase } from "../../usecases/ListNotificationsUseCase";
import { MarkAsReadUseCase } from "../../usecases/MarkAsReadUseCase";

export class NotificationController {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
  ) {}

  async list(request: Request, response: Response): Promise<Response> {
    const userId = request.auth!.userId;
    const { offset, limit } = request.query;

    const result = await this.listNotificationsUseCase.execute({
      userId,
      offset: offset ? Number(offset) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return response.status(200).json(result);
  }

  async markAsRead(request: Request, response: Response): Promise<Response> {
    const notificationId = String(request.params.notificationId);
    const userId = request.auth!.userId;

    await this.markAsReadUseCase.execute({ notificationId, userId });

    return response.status(200).json({ message: "Notification marked as read" });
  }
}
