import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { IEventRepository } from "../domain/repositories/IEventRepository";
import { IEventCriticalSection } from "../domain/transactions/IEventCriticalSection";

export type DeleteEventInput = {
  eventId: string;
  deletedById: string;
  userLevel: number;
  reason?: string;
};

export class DeleteEventUseCase {
  constructor(
    private readonly repo: IEventRepository,
    private readonly criticalSection: IEventCriticalSection,
  ) {}

  async execute(input: DeleteEventInput): Promise<void> {
    const event = await this.repo.findById(input.eventId);
    if (!event) throw new NotFoundError("EVENT_NOT_FOUND");

    if (event.createdById !== input.deletedById && input.userLevel < 80) {
      throw new ForbiddenError("NOT_EVENT_OWNER", undefined, "Você não tem permissão para excluir este evento");
    }

    await this.criticalSection.execute(input.eventId, async (ctx) => {
      const current = await ctx.eventRepository.findById(input.eventId);
      if (!current) throw new NotFoundError("EVENT_NOT_FOUND");
      if (current.isDeleted) throw new ConflictError("EVENT_ALREADY_DELETED");

      const counts = await ctx.eventRepository.countEventRelations(input.eventId);

      if (counts.memberCount > 0 || counts.assignmentCount > 0 || counts.attendanceCount > 0 || counts.financialCount > 0) {
        throw new ConflictError("EVENT_WITH_HISTORY_CANNOT_BE_DELETED");
      }

      await ctx.eventRepository.softDelete(input.eventId, input.deletedById, input.reason);
    });
  }
}
