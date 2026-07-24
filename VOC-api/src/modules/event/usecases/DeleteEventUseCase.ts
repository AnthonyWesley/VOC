import { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { IEventRepository } from "../domain/repositories/IEventRepository";

export type DeleteEventInput = {
  eventId: string;
  deletedById: string;
  userLevel: number;
  reason?: string;
};

export class DeleteEventUseCase {
  constructor(
    private readonly repo: IEventRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(input: DeleteEventInput): Promise<void> {
    const event = await this.repo.findById(input.eventId);
    if (!event) throw new NotFoundError("EVENT_NOT_FOUND");

    if (event.createdById !== input.deletedById && input.userLevel < 80) {
      throw new ForbiddenError("NOT_EVENT_OWNER", undefined, "Você não tem permissão para excluir este evento");
    }

    const [memberCount, assignmentCount, attendanceCount, financialCount] = await Promise.all([
      this.prisma.eventMember.count({ where: { eventId: event.id } }),
      this.prisma.eventAssignment.count({ where: { eventId: event.id } }),
      this.prisma.eventAttendance.count({ where: { eventId: event.id } }),
      this.prisma.financialRecord.count({ where: { eventId: event.id } }),
    ]);

    if (memberCount > 0 || assignmentCount > 0 || attendanceCount > 0 || financialCount > 0) {
      throw new ConflictError("EVENT_WITH_HISTORY_CANNOT_BE_DELETED");
    }

    event.delete(input.deletedById, input.reason);
    await this.repo.softDelete(event.id, input.deletedById, input.reason);
  }
}

