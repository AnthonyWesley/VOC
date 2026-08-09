import { ValidationError } from "../../../shared/errors/ValidationError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { IEventRepository } from "../domain/repositories/IEventRepository";
import { IEventCriticalSection } from "../domain/transactions/IEventCriticalSection";
import { IEventWriteTransaction } from "../domain/transactions/IEventWriteTransaction";
import { IEventAdminRecipientReader } from "../domain/services/IEventAdminRecipientReader";
import { Event } from "../domain/entities/Event";
import { AttendanceMode, EventType } from "@prisma/client";
import { EventAttendance } from "../domain/entities/EventAttendance";
import { FinancialRecord } from "../../financialRecord/domain/entities/FinancialRecord";
import { Decimal } from "@prisma/client/runtime/library";
import { ISocketServer } from "../../../infra/socket/ISocketServer";
import { IRealtimeNotificationPublisher } from "../../../infra/socket/RealtimeNotificationPublisher";
import { CreateNotificationUseCase } from "../../notification/usecases/CreateNotificationUseCase";

export type CloseEventSummaryInput = {
  endsAt?: Date;
  attendance?: {
    membersCount: number;
    visitorsCount: number;
  };
  financialRecords?: {
    amount: number;
    method: string;
    date: Date;
    categoryId: string;
    memberId?: string;
    description?: string;
    recordedById: string;
  }[];
};

export type CloseEventInput = {
  mode: "CLOSE_EXISTING";
  eventId: string;
  summary: CloseEventSummaryInput;
} | {
  mode: "CREATE_CLOSED";
  event: {
    title?: string | null;
    type: EventType;
    startsAt: Date;
    endsAt?: Date;
    preacherId?: string | null;
    theme?: string | null;
    notes?: string | null;
    needsScale?: boolean;
    createdById?: string | null;
  };
  summary: CloseEventSummaryInput;
};

export type CloseEventOutput = { id: string };

export class CloseEventWithSummaryUseCase {
  constructor(
    private readonly repo: IEventRepository,
    private readonly criticalSection: IEventCriticalSection,
    private readonly writeTransaction: IEventWriteTransaction,
    private readonly adminRecipientReader: IEventAdminRecipientReader,
    private readonly socketServer?: ISocketServer,
    private readonly createNotification?: CreateNotificationUseCase,
    private readonly realtimePublisher?: IRealtimeNotificationPublisher,
  ) {}

  async execute(input: CloseEventInput): Promise<CloseEventOutput> {
    if (input.mode === "CLOSE_EXISTING") {
      return this.handleCloseExisting(input);
    }
    return this.handleCreateClosed(input);
  }

  private async handleCloseExisting(input: CloseEventInput & { mode: "CLOSE_EXISTING" }): Promise<CloseEventOutput> {
    const endsAtToSet = input.summary.endsAt ?? (input.summary.attendance ? undefined : new Date());

    const result = await this.criticalSection.execute(input.eventId, async (ctx) => {
      const existing = await ctx.eventRepository.findById(input.eventId);
      if (!existing) throw new NotFoundError("EVENT_NOT_FOUND");
      if (existing.isDeleted) throw new ConflictError("EVENT_ALREADY_DELETED");

      const attendanceMode =
        existing.type === "HOUSE_SERVICE" ? AttendanceMode.INDIVIDUAL : AttendanceMode.SUMMARY;

      const e = Event.rehydrate({
        id: existing.id,
        title: existing.title,
        type: existing.type,
        status: existing.status,
        attendanceMode,
        needsScale: existing.needsScale,
        startsAt: existing.startsAt,
        endsAt: existing.endsAt,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
        preacherId: existing.preacherId,
        theme: existing.theme,
        notes: existing.notes,
        createdById: existing.createdById,
      });

      if (!input.summary.attendance) {
        e.finishEvent({ endsAt: endsAtToSet! });
      }

      let attendance: EventAttendance | undefined;
      if (input.summary.attendance) {
        attendance = EventAttendance.create({
          eventId: e.id,
          membersCount: input.summary.attendance.membersCount,
          visitorsCount: input.summary.attendance.visitorsCount,
        });
      }

      const financialRecords: FinancialRecord[] = [];
      for (const fr of input.summary.financialRecords ?? []) {
        const category = await ctx.categoryReader.findById(fr.categoryId);
        if (!category) throw new NotFoundError("CATEGORY_NOT_FOUND");
        financialRecords.push(
          FinancialRecord.create({
            amount: new Decimal(fr.amount),
            method: fr.method as any,
            date: fr.date,
            direction: category.type,
            recordedById: fr.recordedById,
            categoryId: fr.categoryId,
            memberId: fr.memberId,
            eventId: e.id,
            description: fr.description,
          }),
        );
      }

      const finished = await ctx.eventRepository.markAsFinishedIfScheduled({ id: e.id, endsAt: endsAtToSet! });
      if (!finished) {
        const current = await ctx.eventRepository.findById(e.id);
        if (current?.isDeleted) throw new ConflictError("EVENT_ALREADY_DELETED");
        if (current?.endsAt) throw new ConflictError("EVENT_ALREADY_FINISHED");
        throw new ConflictError("EVENT_STATE_CHANGED");
      }

      await ctx.eventRepository.saveWithAttendanceAndFinancial(e, attendance, financialRecords);

      return { id: e.id };
    });

    return result;
  }

  private async handleCreateClosed(input: CloseEventInput & { mode: "CREATE_CLOSED" }): Promise<CloseEventOutput> {
    const { event: eventInput, summary } = input;

    if (!eventInput.type) throw new ValidationError("MISSING_EVENT_TYPE");
    if (!eventInput.startsAt) throw new ValidationError("MISSING_STARTS_AT");

      const attendanceMode =
        eventInput.type === "HOUSE_SERVICE" ? AttendanceMode.INDIVIDUAL : AttendanceMode.SUMMARY;

      const result = await this.writeTransaction.execute(async (ctx) => {
        const event = Event.create({
          title: eventInput.title ?? null,
          type: eventInput.type,
          attendanceMode,
          needsScale: eventInput.needsScale ?? false,
          startsAt: eventInput.startsAt,
          preacherId: eventInput.preacherId ?? null,
          theme: eventInput.theme ?? null,
          notes: eventInput.notes ?? null,
          createdById: eventInput.createdById ?? null,
        });

        let attendance: EventAttendance | undefined;
        if (summary.attendance) {
          attendance = EventAttendance.create({
            eventId: event.id,
            membersCount: summary.attendance.membersCount,
            visitorsCount: summary.attendance.visitorsCount,
          });
        }

        const financialRecords: FinancialRecord[] = [];
        for (const fr of summary.financialRecords ?? []) {
          const category = await ctx.categoryReader.findById(fr.categoryId);
          if (!category) throw new NotFoundError("CATEGORY_NOT_FOUND");
          financialRecords.push(
            FinancialRecord.create({
              amount: new Decimal(fr.amount),
              method: fr.method as any,
              date: fr.date,
              direction: category.type,
              recordedById: fr.recordedById,
              categoryId: fr.categoryId,
              memberId: fr.memberId,
              eventId: event.id,
              description: fr.description,
            }),
          );
        }

        await ctx.eventRepository.create(event);

        if (eventInput.endsAt) {
          const finished = await ctx.eventRepository.markAsFinishedIfScheduled({ id: event.id, endsAt: eventInput.endsAt });
          if (!finished) {
            throw new ConflictError("EVENT_STATE_CHANGED");
          }
          event.finishEvent({ endsAt: eventInput.endsAt });
        }

        await ctx.eventRepository.saveWithAttendanceAndFinancial(event, attendance, financialRecords);

        return { event, attendance, financialRecords };
    });

    const { event } = result;

    const label = this._eventTypeLabel(event.type);
    const adminIds = await this.adminRecipientReader.findEventAdminUserIds();
    for (const adminId of adminIds) {
      const notifResult = await this.createNotification?.execute({
        userId: adminId, type: "EVENTO_CRIADO",
        title: `Novo evento: ${event.title ?? label}`,
        message: `${label} criado para ${event.startsAt.toLocaleDateString("pt-BR")}.${event.needsScale ? " Precisa de escala!" : ""}`,
        payload: { eventId: event.id, eventTitle: event.title ?? "", eventType: event.type, needsScale: event.needsScale },
        deduplicationKey: `v1:evento-criado:${event.id}`,
      });
      if (notifResult?.created) {
        this.realtimePublisher?.publish(adminId, notifResult.notification);
      }
    }

    return { id: event.id };
  }

  private _eventTypeLabel(type: EventType): string {
    const labels: Record<string, string> = {
      HOUSE_SERVICE: "Culto em Casa", SUNDAY_SERVICE: "Culto de Domingo",
      PRAYER_MEETING: "Oração", BIBLE_STUDY: "Estudo Bíblico",
      YOUTH_NIGHT: "Encontro de Jovens", SPECIAL_EVENT: "Evento Especial",
    };
    return labels[type] ?? type;
  }
}
