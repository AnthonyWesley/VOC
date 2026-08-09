import { PrismaClient } from "@prisma/client";
import { IEventRepository } from "../domain/repositories/IEventRepository";
import { IEventCriticalSection } from "../domain/transactions/IEventCriticalSection";
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
    private readonly criticalSection: IEventCriticalSection,
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

    if (!assignmentId) {
      return this.criticalSection.execute(eventId, async (ctx) => {
        const event = await ctx.eventRepository.findById(eventId);
        if (!event) throw new NotFoundError("EVENT_NOT_FOUND");
        if (event.isDeleted) throw new ConflictError("EVENT_DELETED");
        if (event.status === "CANCELLED") throw new ConflictError("EVENT_ALREADY_CANCELLED");
        if (event.status === "FINISHED") throw new ConflictError("EVENT_FINISHED");

        await ctx.eventRepository.removeMember(eventId, memberId);

        return { id: memberId };
      });
    }

    const assignment = await this.prisma.eventAssignment.findUnique({
      where: { id: assignmentId },
      select: { ministryId: true },
    });

    if (!assignment) throw new NotFoundError("ASSIGNMENT_NOT_FOUND");

    if (assignment.ministryId) {
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

      const isLeader = user?.member?.id && user.member.id === ministry?.leaderId;
      if (!isLeader && userLevel < 80) {
        throw new ForbiddenError(
          "NOT_MINISTRY_LEADER",
          undefined,
          "Você não é líder deste ministério",
        );
      }
    }

    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { fullName: true, userId: true, phone: true },
    });

    const result = await this.criticalSection.execute(eventId, async (ctx) => {
      const event = await ctx.eventRepository.findById(eventId);
      if (!event) throw new NotFoundError("EVENT_NOT_FOUND");
      if (event.isDeleted) throw new ConflictError("EVENT_DELETED");
      if (event.status === "CANCELLED") throw new ConflictError("EVENT_ALREADY_CANCELLED");
      if (event.status === "FINISHED") throw new ConflictError("EVENT_FINISHED");

      await ctx.eventRepository.removeAssignment(assignmentId);

      const ministry = assignment.ministryId
        ? await ctx.ministryReader.findById(assignment.ministryId)
        : null;

      const eventLabel = event.title ?? event.type;
      const dateStr = event.startsAt.toLocaleDateString("pt-BR");
      const ministryName = ministry?.name ?? "ministério";

      let notificationResult: Awaited<ReturnType<CreateNotificationUseCase["execute"]>> | null = null;

      if (member?.userId && this.createNotification) {
        notificationResult = await this.createNotification.execute(
          {
            userId: member.userId,
            type: "MEMBRO_REMOVIDO",
            title: "Removido da escala",
            message: `Você foi removido de ${ministryName} no evento ${eventLabel} (${dateStr}).`,
            payload: {
              eventId,
              memberId,
              ministryName,
              eventTitle: event.title ?? "",
              eventDate: dateStr,
            },
            deduplicationKey: `v1:membro-removido:${assignmentId}`,
          },
          {
            repository: ctx.notificationRepository,
            recoverDeduplicationConflict: false,
          },
        );
      }

      return { memberPhone: member?.phone, memberFullName: member?.fullName, memberUserId: member?.userId, eventTitle: eventLabel, eventDate: dateStr, notificationResult };
    });

    if (result.memberUserId && this.createNotification && this.realtimePublisher && result.notificationResult?.created) {
      this.realtimePublisher.publish(result.memberUserId, result.notificationResult.notification);
    }

    if (result.memberPhone && this.whatsApp) {
      this.dispatchWhatsAppBestEffort({
        phone: result.memberPhone,
        message: `Oi ${result.memberFullName}, tudo bem? Informamos que você não estará mais na escala para o evento *${result.eventTitle}* em ${result.eventDate}. Obrigado pela sua disponibilidade, e em breve surgirão novas oportunidades para servir.`,
      });
    }

    return { id: memberId };
  }

  private dispatchWhatsAppBestEffort(input: { phone: string; message: string }): void {
    try {
      void this.whatsApp!
        .sendMessage(input.phone, input.message, "default")
        .then((result) => {
          if (!result.ok && result.code !== "NOT_CONFIGURED") {
            createLogger("remove-member-event").warn({ operation: "whatsapp_send", resultCode: result.code, phone: maskPhone(input.phone) }, "WhatsApp message was not accepted");
          }
        })
        .catch((error: unknown) => {
          createLogger("remove-member-event").error({ operation: "whatsapp_send", error }, "Unexpected WhatsApp error");
        });
    } catch (error: unknown) {
      createLogger("remove-member-event").error({ operation: "whatsapp_dispatch", error }, "WhatsApp dispatch failed");
    }
  }
}
