import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { IEventRepository } from "../domain/repositories/IEventRepository";

export type DeleteEventInput = {
  eventId: string;
  deletedById: string;
  userLevel: number;
  reason?: string;
};

export class DeleteEventUseCase {
  constructor(private readonly repo: IEventRepository) {}

  async execute(input: DeleteEventInput): Promise<void> {
    const event = await this.repo.findById(input.eventId);

    if (!event) {
      throw new NotFoundError("EVENT_NOT_FOUND");
    }

    if (event.createdById !== input.deletedById && input.userLevel < 80) {
      throw new ForbiddenError("NOT_EVENT_OWNER", undefined, "Você não tem permissão para excluir este evento");
    }

    event.delete(input.deletedById, input.reason);

    await this.repo.saveWithAttendanceAndFinancial(event);
  }
}
