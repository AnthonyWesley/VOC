import { IEventRepository } from "../domain/repositories/IEventRepository";
import { IEventCriticalSection } from "../domain/transactions/IEventCriticalSection";
import { Event } from "../domain/entities/Event";
import { EventAttendance } from "../domain/entities/EventAttendance";
import { EventCorrectionChanges } from "../domain/repositories/IEventCorrectionRepository";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { ValidationError } from "../../../shared/errors/ValidationError";

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

export type CorrectEventOutput = {
  id: string;
  corrections: number;
};

export class CorrectEventUseCase {
  constructor(
    private readonly _repo: IEventRepository,
    private readonly criticalSection: IEventCriticalSection,
  ) {}

  async execute(input: CorrectEventInput): Promise<CorrectEventOutput> {
    if (!input.reason || input.reason.trim().length < 3) {
      throw new ValidationError("CORRECTION_REASON_REQUIRED");
    }

    return this.criticalSection.execute(input.eventId, async (ctx) => {
      const event = await ctx.eventRepository.findById(input.eventId);
      if (!event) throw new NotFoundError("EVENT_NOT_FOUND");
      if (event.isDeleted) throw new ConflictError("EVENT_DELETED");
      if (event.status !== "FINISHED") throw new ConflictError("EVENT_NOT_FINISHED");

      if (input.preacherId !== undefined) {
        const preacher = await ctx.memberReader.findById(input.preacherId);
        if (!preacher) throw new ValidationError("PREACHER_NOT_FOUND");
      }

      if (event.attendanceMode === "INDIVIDUAL" && (input.membersCount !== undefined || input.visitorsCount !== undefined)) {
        throw new ValidationError("INDIVIDUAL_ATTENDANCE_COUNTS_ARE_DERIVED");
      }

      const changes: EventCorrectionChanges = {};
      let currentAttendance: EventAttendance | null = null;

      if (input.theme !== undefined && input.theme !== event.theme) {
        changes.theme = { before: event.theme, after: input.theme };
      }
      if (input.notes !== undefined && input.notes !== event.notes) {
        changes.notes = { before: event.notes, after: input.notes };
      }
      if (input.preacherId !== undefined && input.preacherId !== event.preacherId) {
        changes.preacherId = { before: event.preacherId, after: input.preacherId };
      }

      if (event.attendanceMode !== "INDIVIDUAL") {
        if (input.membersCount !== undefined || input.visitorsCount !== undefined) {
          currentAttendance = await ctx.eventRepository.findAttendance(event.id);
          if (input.membersCount !== undefined && input.membersCount !== (currentAttendance?.membersCount ?? 0)) {
            changes.membersCount = { before: currentAttendance?.membersCount ?? 0, after: input.membersCount };
          }
          if (input.visitorsCount !== undefined && input.visitorsCount !== (currentAttendance?.visitorsCount ?? 0)) {
            changes.visitorsCount = { before: currentAttendance?.visitorsCount ?? 0, after: input.visitorsCount };
          }
        }
      }

      if (Object.keys(changes).length === 0) {
        throw new ValidationError("NO_CHANGES_DETECTED");
      }

      const eventEntity = Event.rehydrate({
        id: event.id,
        title: event.title,
        type: event.type,
        status: event.status,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        preacherId: event.preacherId,
        theme: event.theme,
        notes: event.notes,
        needsScale: event.needsScale,
        attendanceMode: event.attendanceMode,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        createdById: event.createdById,
      });
      eventEntity.update({
        theme: input.theme !== undefined ? input.theme : undefined,
        notes: input.notes !== undefined ? input.notes : undefined,
        preacherId: input.preacherId !== undefined ? input.preacherId : undefined,
      });

      let attendance: EventAttendance | undefined;
      if (event.attendanceMode !== "INDIVIDUAL" && (input.membersCount !== undefined || input.visitorsCount !== undefined)) {
        attendance = currentAttendance
          ? EventAttendance.rehydrate({
              id: currentAttendance.id,
              eventId: event.id,
              membersCount: input.membersCount ?? currentAttendance.membersCount,
              visitorsCount: input.visitorsCount ?? currentAttendance.visitorsCount,
              createdAt: currentAttendance.createdAt,
              updatedAt: new Date(),
            })
          : EventAttendance.create({
              eventId: event.id,
              membersCount: input.membersCount ?? 0,
              visitorsCount: input.visitorsCount ?? 0,
            });
      }

      await ctx.eventRepository.saveWithAttendanceAndFinancial(eventEntity, attendance);
      await ctx.correctionRepository.create({
        eventId: event.id,
        correctedById: input.correctedById,
        reason: input.reason.trim(),
        changes,
      });

      return { id: event.id, corrections: Object.keys(changes).length };
    });
  }
}
