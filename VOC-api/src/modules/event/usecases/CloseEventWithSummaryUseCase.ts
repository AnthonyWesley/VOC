import { ValidationError } from "../../../shared/errors/ValidationError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { IEventRepository } from "../domain/repositories/IEventRepository";
import { ICategoryRepository } from "../../category/domain/repositories/ICategoryRepository";
import { Event } from "../domain/entities/Event";
import { AttendanceMode, EventType } from "@prisma/client";
import { EventAttendance } from "../domain/entities/EventAttendance";
import { FinancialRecord } from "../../financialRecord/domain/entities/FinancialRecord";
import { Decimal } from "@prisma/client/runtime/library";
import { ISocketServer } from "../../../infra/socket/ISocketServer";
import { IRealtimeNotificationPublisher } from "../../../infra/socket/RealtimeNotificationPublisher";
import { CreateNotificationUseCase } from "../../notification/usecases/CreateNotificationUseCase";
import { PrismaClient } from "@prisma/client";

export type CloseEventInput = {
  event: {
    id?: string;
    title?: string | null;
    type: EventType;
    startsAt: Date;
    endsAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    preacherId?: string | null;
    theme?: string | null;
    notes?: string | null;
    needsScale?: boolean;
    createdById?: string | null;
  };
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

export type CloseEventOutput = { id: string };

export class CloseEventWithSummaryUseCase {
  constructor(
    private readonly repo: IEventRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly prisma: PrismaClient,
    private readonly socketServer?: ISocketServer,
    private readonly createNotification?: CreateNotificationUseCase,
    private readonly realtimePublisher?: IRealtimeNotificationPublisher,
  ) {}

  async execute(input: CloseEventInput): Promise<CloseEventOutput> {
    if (!input.event.type) throw new ValidationError("MISSING_EVENT_TYPE");
    if (!input.event.startsAt) throw new ValidationError("MISSING_STARTS_AT");

    const isNew = !input.event.id;
    const attendanceMode =
      input.event.type === "HOUSE_SERVICE" ? AttendanceMode.INDIVIDUAL : AttendanceMode.SUMMARY;

    let event: Event;

    if (!isNew) {
      const existing = await this.repo.findById(input.event.id!);
      if (!existing) throw new NotFoundError("EVENT_NOT_FOUND");
      if (existing.isDeleted) throw new ConflictError("EVENT_ALREADY_DELETED");

      event = Event.rehydrate({
        id: existing.id,
        title: input.event.title ?? existing.title,
        type: existing.type,
        status: existing.status,
        attendanceMode,
        needsScale: input.event.needsScale ?? existing.needsScale,
        startsAt: input.event.startsAt ?? existing.startsAt,
        endsAt: input.event.endsAt ?? existing.endsAt,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
        preacherId: input.event.preacherId ?? existing.preacherId,
        theme: input.event.theme ?? existing.theme,
        notes: input.event.notes ?? existing.notes,
        createdById: existing.createdById,
      });
    } else {
      event = Event.create({
        title: input.event.title ?? null,
        type: input.event.type,
        attendanceMode,
        needsScale: input.event.needsScale ?? false,
        startsAt: input.event.startsAt,
        preacherId: input.event.preacherId ?? null,
        theme: input.event.theme ?? null,
        notes: input.event.notes ?? null,
        createdById: input.event.createdById ?? null,
      });
    }

    if (input.event.endsAt) {
      event.finishEvent({ endsAt: input.event.endsAt });
    }

    let attendance: EventAttendance | undefined;
    if (input.attendance) {
      attendance = EventAttendance.create({
        eventId: event.id,
        membersCount: input.attendance.membersCount,
        visitorsCount: input.attendance.visitorsCount,
      });
    }

    const financialRecords: FinancialRecord[] = [];
    for (const fr of input.financialRecords ?? []) {
      const category = await this.categoryRepo.findById(fr.categoryId);
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

    if (!isNew) {
      const endsAtToSet = input.event.endsAt ?? new Date();
      const finished = await this.repo.markAsFinishedIfScheduled({ id: event.id, endsAt: endsAtToSet });
      if (!finished) {
        const current = await this.repo.findById(event.id);
        if (current?.isDeleted) throw new ConflictError("EVENT_ALREADY_DELETED");
        if (current?.endsAt) throw new ConflictError("EVENT_ALREADY_FINISHED");
        throw new ConflictError("EVENT_STATE_CHANGED");
      }
    }

    if (isNew) {
      await this.repo.create(event);
    }
    await this.repo.saveWithAttendanceAndFinancial(event, attendance, financialRecords);

    if (isNew) {
      const label = this._eventTypeLabel(event.type);
      const admins = await this.prisma.user.findMany({
        where: { isActive: true, roles: { some: { role: { level: { gte: 80 } } } } },
        select: { id: true },
      });
      for (const admin of admins) {
        const result = await this.createNotification?.execute({
          userId: admin.id, type: "EVENTO_CRIADO",
          title: `Novo evento: ${event.title ?? label}`,
          message: `${label} criado para ${event.startsAt.toLocaleDateString("pt-BR")}.${event.needsScale ? " Precisa de escala!" : ""}`,
          payload: { eventId: event.id, eventTitle: event.title ?? "", eventType: event.type, needsScale: event.needsScale },
          deduplicationKey: `v1:evento-criado:${event.id}`,
        });
        if (result?.created) {
          this.realtimePublisher?.publish(admin.id, result.notification);
        }
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
