import { IEventRepository } from "../domain/repositories/IEventRepository";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { ISocketServer } from "../../../infra/socket/ISocketServer";
import { CreateNotificationUseCase } from "../../notification/usecases/CreateNotificationUseCase";
import { IWhatsAppService } from "../../../infra/whatsapp/IWhatsAppService";
import { PrismaClient } from "@prisma/client";

export type AssignMemberToEventInput = {
  eventId: string;
  memberId: string;
  ministryId?: string;
  userId: string;
  userLevel: number;
};

export type AssignMemberToEventOutput = {
  id: string;
};

export class AssignMemberToEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly prisma: PrismaClient,
    private readonly socketServer?: ISocketServer,
    private readonly createNotification?: CreateNotificationUseCase,
    private readonly whatsApp?: IWhatsAppService,
  ) {}

  async execute(
    input: AssignMemberToEventInput,
  ): Promise<AssignMemberToEventOutput> {
    const { eventId, memberId, ministryId, userId, userLevel } = input;

    if (!eventId) throw new ValidationError("MISSING_EVENT_ID");
    if (!memberId) throw new ValidationError("MISSING_MEMBER_ID");

    if (ministryId) {
      const [ministry, user] = await Promise.all([
        this.prisma.ministry.findUnique({
          where: { id: ministryId },
          select: { leaderId: true },
        }),
        this.prisma.user.findUnique({
          where: { id: userId },
          include: { member: { select: { id: true } } },
        }),
      ]);

      const isLeader = user?.member?.id && user.member.id === ministry?.leaderId;
      if (!isLeader && userLevel < 80) {
        throw new ForbiddenError("NOT_MINISTRY_LEADER", undefined, "Você não é líder deste ministério");
      }

      await this.eventRepository.assignAssignment(eventId, memberId, ministryId);
      await this._notifyMemberAssigned(eventId, memberId, ministryId);
    } else {
      await this.eventRepository.assignMember(eventId, memberId);
    }

    return { id: memberId };
  }

  private async _notifyMemberAssigned(eventId: string, memberId: string, ministryId: string) {
    const [event, member, ministry] = await Promise.all([
      this.prisma.event.findUnique({ where: { id: eventId }, select: { title: true, type: true, startsAt: true } }),
      this.prisma.member.findUnique({ where: { id: memberId }, select: { fullName: true, userId: true, phone: true } }),
      this.prisma.ministry.findUnique({ where: { id: ministryId }, select: { name: true } }),
    ]);

    if (!event || !member || !ministry) return;

    const eventLabel = event.title ?? event.type;
    const dateStr = event.startsAt.toLocaleDateString("pt-BR");

    if (member.userId) {
      await this.createNotification?.execute({
        userId: member.userId,
        type: "MEMBRO_ESCALADO",
        title: `Você foi escalado!`,
        message: `Você foi escalado para ${ministry.name} no evento ${eventLabel} em ${dateStr}.`,
        payload: { eventId, ministryId, ministryName: ministry.name, eventTitle: event.title, eventDate: dateStr },
      });
      this.socketServer?.emitToUser(member.userId, "notification", { type: "MEMBRO_ESCALADO", eventId });
    }

    if (member.phone) {
      await this.whatsApp?.sendMessage(
        member.phone,
        `Oi ${member.fullName}! 🌟 Você foi convidado para servir no *${ministry.name}* durante o evento *${eventLabel}* em ${dateStr}. Sua participação é muito importante — obrigado por se dedicar!`,
        "default",
      ).catch(() => {});
    }
  }
}
