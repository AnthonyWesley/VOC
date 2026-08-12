import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { IEventRepository } from "../domain/repositories/IEventRepository";
import { IEventCriticalSection } from "../domain/transactions/IEventCriticalSection";

export type CancelEventInput = {
  eventId: string;
  cancelledById: string;
  reason: string;
};

export class CancelEventUseCase {
  constructor(
    private readonly repo: IEventRepository,
    private readonly criticalSection: IEventCriticalSection,
  ) {}

  async execute(input: CancelEventInput) {
    return this.criticalSection.execute(input.eventId, async (ctx) => {
      const event = await ctx.eventRepository.findById(input.eventId);
      if (!event) throw new NotFoundError("EVENT_NOT_FOUND");

      event.cancel(input.cancelledById, input.reason);

      const cancelled = await ctx.eventRepository.markAsCancelledIfScheduled({
        id: event.id,
        cancelledAt: event.cancelledAt!,
        cancelledById: event.cancelledById!,
        cancelReason: event.cancelReason!,
      });

      if (!cancelled) {
        const current = await ctx.eventRepository.findById(event.id);
        if (current?.isDeleted) throw new ConflictError("EVENT_DELETED");
        if (current?.status === "FINISHED") throw new ConflictError("CANNOT_CANCEL_FINISHED_EVENT");
        if (current?.status === "CANCELLED") throw new ConflictError("EVENT_ALREADY_CANCELLED");
        throw new ConflictError("EVENT_STATE_CHANGED");
      }

      return { id: event.id, status: "CANCELLED" };
    });
  }
}
