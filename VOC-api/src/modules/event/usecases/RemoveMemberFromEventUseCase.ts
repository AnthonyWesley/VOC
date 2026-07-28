import { PrismaClient } from "@prisma/client";
import { IEventRepository } from "../domain/repositories/IEventRepository";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { ISocketServer } from "../../../infra/socket/ISocketServer";
import { IRealtimeNotificationPublisher } from "../../../infra/socket/RealtimeNotificationPublisher";
import { CreateNotificationUseCase } from "../../notification/usecases/CreateNotificationUseCase";
import { IWhatsAppService } from "../../../infra/whatsapp/IWhatsAppService";
import { createLogger } from "../../../shared/logger/logger";
import { maskPhone } from "../../../shared/types/whatsapp";

export type RemoveMemberFromEventInput = {
  eventId: string;
  memberId: string;
  assignmentId?: string;
  userId: string;
  userLevel: number;
};

export type RemoveMemberFromEventOutput = {
  id: string;
};

export class RemoveMemberFromEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly prisma: PrismaClient,
    private readonly socketServer?: ISocketServer,
    private readonly createNotification?: CreateNotificationUseCase,
    private readonly whatsApp?: IWhatsAppService,
    private readonly realtimePublisher?: IRealtimeNotificationPublisher,
  ) {}

  async execute(
    input: RemoveMemberFromEventInput,
  ): Promise<RemoveMemberFromEventOutput> {
    const { eventId, memberId, assignmentId, userId, userLevel } = input;

    if (!eventId) {
      throw new ValidationError("MISSING_Event_ID");
    }

    if (!memberId) {
      throw new ValidationError("MISSING_MEMBER_ID");
    }

    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new NotFoundError("EVENT_NOT_FOUND");
    }

    if (event.status === "CANCELLED") {
      throw new ConflictError("EVENT_ALREADY_CANCELLED");
    }

    if (event.status === "FINISHED") {
      throw new ConflictError("EVENT_FINISHED");
    }

    if (event.isDeleted) {
      throw new ConflictError("EVENT_DELETED");
    }

    if (assignmentId) {
      const assignment = await this.prisma.eventAssignment.findUnique({
        where: { id: assignmentId },
        select: {
          ministryId: true,
        },
      });

      if (assignment?.ministryId) {
        const [ministry, user] = await Promise.all([
          this.prisma.ministry.findUnique({
            where: { id: assignment.ministryId },
            select: { leaderId: true },
          }),
          this.prisma.user.findUnique({
            where: { id: userId },
            include: { member: { select: { id: true } } },
          }),
        ]);

        const isLeader =
          user?.member?.id && user.member.id === ministry?.leaderId;
        if (!isLeader && userLevel < 80) {
          throw new ForbiddenError(
            "NOT_MINISTRY_LEADER",
            undefined,
            "Você não é líder deste ministério",
          );
        }
      }

      await this.eventRepository.removeAssignment(assignmentId);
      const ministryId = assignment?.ministryId;
      await this._notifyMemberRemoved(eventId, memberId, ministryId, assignmentId);
    } else {
      await this.eventRepository.removeMember(eventId, memberId);
    }

    return {
      id: memberId,
    };
  }

  private async _notifyMemberRemoved(
    eventId: string,
    memberId: string,
    ministryId?: string,
    assignmentId?: string,
  ) {
    const [event, member, ministry] = await Promise.all([
      this.prisma.event.findUnique({
        where: { id: eventId },
        select: { title: true, type: true, startsAt: true },
      }),
      this.prisma.member.findUnique({
        where: { id: memberId },
        select: { fullName: true, userId: true, phone: true },
      }),
      ministryId
        ? this.prisma.ministry.findUnique({
            where: { id: ministryId },
            select: { name: true },
          })
        : undefined,
    ]);

    if (!event || !member) return;

    const eventLabel = event.title ?? event.type;
    const dateStr = event.startsAt.toLocaleDateString("pt-BR");
    const ministryName = ministry?.name ?? "ministério";

    if (member.userId) {
      const result = await this.createNotification?.execute({
        userId: member.userId,
        type: "MEMBRO_REMOVIDO",
        title: `Removido da escala`,
        message: `Você foi removido de ${ministryName} no evento ${eventLabel} (${dateStr}).`,
        payload: {
          eventId,
          memberId,
          ministryName,
          eventTitle: event.title ?? "",
          eventDate: dateStr,
        },
        deduplicationKey: assignmentId ? `v1:membro-removido:${assignmentId}` : undefined,
      });
      if (result?.created) {
        this.realtimePublisher?.publish(member.userId, result.notification);
      }
    }

    if (member.phone) {
      const result = await this.whatsApp!
        .sendMessage(
          member.phone,
          `Oi ${member.fullName}, tudo bem? Informamos que você não estará mais na escala do *${ministryName}* para o evento *${eventLabel}* em ${dateStr}. Obrigado pela sua disponibilidade, e em breve surgirão novas oportunidades para servir.`,
          "default",
        );

      if (!result.ok && result.code !== "NOT_CONFIGURED") {
        createLogger("remove-member-event").warn({ operation: "whatsapp_send", resultCode: result.code, phone: maskPhone(member.phone) }, "WhatsApp message was not accepted");
      }
    }
  }
}
