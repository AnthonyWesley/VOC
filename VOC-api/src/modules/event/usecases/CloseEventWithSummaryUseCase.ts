import { ValidationError } from "../../../shared/errors/ValidationError";
import { IEventRepository } from "../domain/repositories/IEventRepository";
import { Event } from "../domain/entities/Event";
import { AttendanceMode, EventType, PaymentMethod } from "@prisma/client";
import { EventAttendance } from "../domain/entities/EventAttendance";
import { ISocketServer } from "../../../infra/socket/ISocketServer";
import { CreateNotificationUseCase } from "../../notification/usecases/CreateNotificationUseCase";
import { PrismaClient } from "@prisma/client";
import { IWhatsAppService } from "../../../infra/whatsapp/IWhatsAppService";

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
    method: PaymentMethod;
    date: Date;
    categoryId: string;
    memberId?: string;
    description?: string;
    recordedById: string;
  }[];
};

export type CloseEventOutput = {
  id: string;
};

export class CloseEventWithSummaryUseCase {
  constructor(
    private readonly repo: IEventRepository,
    private readonly prisma: PrismaClient,
    private readonly socketServer?: ISocketServer,
    private readonly createNotification?: CreateNotificationUseCase,
    private readonly whatsApp?: IWhatsAppService,
  ) {}

  async execute(input: CloseEventInput): Promise<CloseEventOutput> {
    if (!input.event.type) throw new ValidationError("MISSING_EVENT_TYPE");
    if (!input.event.startsAt) throw new ValidationError("MISSING_OCCURRENCE_DATE");

    let event;
    const isNew = !input.event.id;

    const attendanceMode =
      input.event.type === "HOUSE_SERVICE"
        ? AttendanceMode.INDIVIDUAL
        : AttendanceMode.SUMMARY;

    if (input.event.id) {
      event = Event.rehydrate({
        id: input.event.id,
        title: input.event.title ?? null,
        type: input.event.type,
        attendanceMode,
        needsScale: input.event.needsScale ?? false,
        startsAt: input.event.startsAt,
        endsAt: input.event.endsAt,
        createdAt: input.event.createdAt,
        updatedAt: input.event.updatedAt,
        preacherId: input.event.preacherId ?? null,
        theme: input.event.theme ?? null,
        notes: input.event.notes ?? null,
        createdById: input.event.createdById ?? null,
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

    let attendance: EventAttendance | undefined;
    if (input.attendance) {
      attendance = EventAttendance.create({
        eventId: event.id,
        membersCount: input.attendance.membersCount,
        visitorsCount: input.attendance.visitorsCount,
      });
    }

    await this.repo.saveWithAttendanceAndFinancial(event, attendance);

    if (isNew) {
      await this._notifyEventCreated(event);
    }

    return { id: event.id };
  }

  private async _notifyEventCreated(event: Event) {
    const eventTypeLabel = this._eventTypeLabel(event.type);

    const admins = await this.prisma.user.findMany({
      where: { isActive: true, roles: { some: { role: { level: { gte: 80 } } } } },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.createNotification?.execute({
        userId: admin.id,
        type: "EVENTO_CRIADO",
        title: `Novo evento: ${event.title ?? eventTypeLabel}`,
        message: `${eventTypeLabel} criado para ${event.startsAt.toLocaleDateString("pt-BR")}.${event.needsScale ? " Precisa de escala!" : ""}`,
        payload: { eventId: event.id, eventTitle: event.title, eventType: event.type, needsScale: event.needsScale },
      });
      this.socketServer?.emitToUser(admin.id, "notification", { type: "EVENTO_CRIADO", eventId: event.id });
    }

    if (event.needsScale) {
      await this._notifyMinistryLeaders(event);
    }
  }

  private async _notifyMinistryLeaders(event: Event) {
    const leaders = await this.prisma.user.findMany({
      where: { isActive: true, roles: { some: { role: { level: { gte: 40 } } } } },
      select: { id: true, member: { select: { phone: true, fullName: true } } },
    });

    const eventLabel = event.title ?? this._eventTypeLabel(event.type);
    const dateStr = event.startsAt.toLocaleDateString("pt-BR");

    for (const leader of leaders) {
      await this.createNotification?.execute({
        userId: leader.id,
        type: "ESCALA_PENDENTE",
        title: `Escala pendente — ${eventLabel}`,
        message: `O evento ${eventLabel} precisa de escala. Acesse e adicione os membros.`,
        payload: { eventId: event.id, eventTitle: event.title, eventType: event.type },
      });
      this.socketServer?.emitToUser(leader.id, "notification", { type: "ESCALA_PENDENTE", eventId: event.id });

      if (leader.member?.phone) {
        await this.whatsApp?.sendMessage(
          leader.member.phone,
          `Oi ${leader.member.fullName}! 🙌 O evento *${eventLabel}* em ${dateStr} está chegando e precisamos organizar a escala. Contamos com você para ajudar a distribuir os ministérios e garantir que tudo aconteça da melhor forma.`,
          "default",
        ).catch(() => {});
      }
    }
  }

  private _eventTypeLabel(type: EventType): string {
    const labels: Record<string, string> = {
      HOUSE_SERVICE: "Culto em Casa",
      SUNDAY_SERVICE: "Culto de Domingo",
      PRAYER_MEETING: "Oração",
      BIBLE_STUDY: "Estudo Bíblico",
      YOUTH_NIGHT: "Encontro de Jovens",
      SPECIAL_EVENT: "Evento Especial",
    };
    return labels[type] ?? type;
  }
}
