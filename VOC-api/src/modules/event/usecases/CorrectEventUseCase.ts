import { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IEventRepository } from "../domain/repositories/IEventRepository";
import { Event } from "../domain/entities/Event";

export type CorrectEventInput = {
  eventId: string;
  correctedById: string;
  reason: string;
  theme?: string;
  notes?: string;
  preacherId?: string;
  membersCount?: number;
  visitorsCount?: number;
};

export class CorrectEventUseCase {
  constructor(
    private readonly repo: IEventRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(input: CorrectEventInput) {
    if (!input.reason || input.reason.trim().length < 3) {
      throw new ValidationError("CORRECTION_REASON_REQUIRED");
    }

    const event = await this.repo.findById(input.eventId);
    if (!event) throw new NotFoundError("EVENT_NOT_FOUND");
    if (event.isDeleted) throw new ConflictError("EVENT_DELETED");
    if (event.status !== "FINISHED") throw new ConflictError("EVENT_NOT_FINISHED");

    // Validate preacher if provided
    if (input.preacherId !== undefined) {
      const preacher = await this.prisma.member.findUnique({ where: { id: input.preacherId } });
      if (!preacher) throw new NotFoundError("PREACHER_NOT_FOUND");
    }

    // Validate counts for attendance mode
    if (event.attendanceMode === "INDIVIDUAL" && (input.membersCount !== undefined || input.visitorsCount !== undefined)) {
      throw new ConflictError("INDIVIDUAL_ATTENDANCE_COUNTS_ARE_DERIVED");
    }

    return this.prisma.$transaction(async (tx) => {
      const changes: Record<string, { before: any; after: any }> = {};

      if (input.theme !== undefined && input.theme !== event.theme) {
        changes.theme = { before: event.theme, after: input.theme };
        await tx.event.update({ where: { id: event.id }, data: { theme: input.theme } });
      }
      if (input.notes !== undefined && input.notes !== event.notes) {
        changes.notes = { before: event.notes, after: input.notes };
        await tx.event.update({ where: { id: event.id }, data: { notes: input.notes } });
      }
      if (input.preacherId !== undefined && input.preacherId !== event.preacherId) {
        changes.preacherId = { before: event.preacherId, after: input.preacherId };
        await tx.event.update({ where: { id: event.id }, data: { preacherId: input.preacherId } });
      }

      // Attendance counts (SUMMARY only)
      if (event.attendanceMode !== "INDIVIDUAL") {
        if (input.membersCount !== undefined) {
          const currentAttendance = await tx.eventAttendance.findUnique({ where: { eventId: event.id } });
          changes.membersCount = { before: currentAttendance?.membersCount ?? 0, after: input.membersCount };
          await tx.eventAttendance.upsert({
            where: { eventId: event.id },
            update: { membersCount: input.membersCount },
            create: { eventId: event.id, membersCount: input.membersCount, visitorsCount: input.visitorsCount ?? 0 },
          });
        }
        if (input.visitorsCount !== undefined) {
          const currentAttendance = await tx.eventAttendance.findUnique({ where: { eventId: event.id } });
          changes.visitorsCount = { before: currentAttendance?.visitorsCount ?? 0, after: input.visitorsCount };
          await tx.eventAttendance.upsert({
            where: { eventId: event.id },
            update: { visitorsCount: input.visitorsCount },
            create: { eventId: event.id, visitorsCount: input.visitorsCount, membersCount: input.membersCount ?? 0 },
          });
        }
      }

      if (Object.keys(changes).length === 0) {
        throw new ValidationError("NO_CHANGES_DETECTED");
      }

      await tx.eventCorrection.create({
        data: {
          eventId: event.id,
          correctedById: input.correctedById,
          reason: input.reason.trim(),
          changes,
        },
      });

      return { id: event.id, corrections: Object.keys(changes).length };
    });
  }
}
