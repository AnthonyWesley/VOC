import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { IEventRepository } from "../domain/repositories/IEventRepository";

export type CancelEventInput = {
  eventId: string;
  cancelledById: string;
  reason: string;
};

export class CancelEventUseCase {
  constructor(private readonly repo: IEventRepository) {}

  async execute(input: CancelEventInput) {
    const event = await this.repo.findById(input.eventId);
    if (!event) throw new NotFoundError("EVENT_NOT_FOUND");

    event.cancel(input.cancelledById, input.reason);

    const cancelled = await this.repo.markAsCancelledIfScheduled({
      id: event.id,
      cancelledAt: event.cancelledAt!,
      cancelledById: event.cancelledById!,
      cancelReason: event.cancelReason!,
    });

    if (!cancelled) {
      const current = await this.repo.findById(event.id);
      if (current?.isDeleted) throw new ConflictError("EVENT_DELETED");
      if (current?.status === "FINISHED") throw new ConflictError("CANNOT_CANCEL_FINISHED_EVENT");
      if (current?.status === "CANCELLED") throw new ConflictError("EVENT_ALREADY_CANCELLED");
      throw new ConflictError("EVENT_STATE_CHANGED");
    }

    return { id: event.id, status: "CANCELLED" };
  }
}
