import { PrismaClient } from "@prisma/client";
import { IEventRepository } from "../domain/repositories/IEventRepository";
import { IEventAssignmentRepository } from "../domain/repositories/IEventAssignmentRepository";
import { IEventCriticalSection } from "../domain/transactions/IEventCriticalSection";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { IRealtimeNotificationPublisher } from "../../../infra/socket/RealtimeNotificationPublisher";
import { CreateNotificationUseCase } from "../../notification/usecases/CreateNotificationUseCase";
import { IWhatsAppService } from "../../../infra/whatsapp/IWhatsAppService";
import { createLogger } from "../../../shared/logger/logger";
import { maskPhone } from "../../../shared/types/whatsapp";
import { isPrismaUniqueViolation } from "../../../shared/utils/isPrismaUniqueViolation";

const logger = createLogger("assign-member-event");

export type AssignMemberToEventInput = {
  eventId: string;
  memberId: string;
  ministryId?: string;
  userId: string;
  userLevel: number;
};

export type AssignMemberToEventOutput = { id: string; alreadyAssigned?: boolean; alreadyPresent?: boolean };

export class AssignMemberToEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly assignmentLookup: IEventAssignmentRepository,
    private readonly criticalSection: IEventCriticalSection,
    private readonly createNotification: CreateNotificationUseCase,
    private readonly prisma: PrismaClient,
    private readonly whatsApp: IWhatsAppService,
    private readonly realtimePublisher: IRealtimeNotificationPublisher,
  ) {}

  async execute(input: AssignMemberToEventInput): Promise<AssignMemberToEventOutput> {
    const { eventId, memberId, ministryId, userId, userLevel } = input;
    if (!eventId) throw new ValidationError("MISSING_EVENT_ID");
    if (!memberId) throw new ValidationError("MISSING_MEMBER_ID");

    const [member, user, ministry] = await Promise.all([
      this.prisma.member.findUnique({ where: { id: memberId }, select: { id: true, fullName: true, userId: true, phone: true } }),
      this.prisma.user.findUnique({ where: { id: userId }, include: { member: { select: { id: true } } } }),
      ministryId ? this.prisma.ministry.findUnique({ where: { id: ministryId }, select: { id: true, name: true, leaderId: true } }) : null,
    ]);

    if (!member) throw new NotFoundError("MEMBER_NOT_FOUND");
    if (ministryId && !ministry) throw new NotFoundError("MINISTRY_NOT_FOUND");

    const memberUserId = member.userId;

    if (ministryId && ministry) {
      const isLeader = user?.member?.id && user.member.id === ministry.leaderId;
      if (!isLeader && userLevel < 80) throw new ForbiddenError("NOT_MINISTRY_LEADER", undefined, "Você não é líder deste ministério");
    }

    if (!ministryId) {
      return this.criticalSection.execute(eventId, async (ctx) => {
        const event = await ctx.eventRepository.findById(eventId);
        if (!event) throw new NotFoundError("EVENT_NOT_FOUND");
        if (event.isDeleted) throw new ConflictError("EVENT_DELETED");
        if (event.status === "CANCELLED") throw new ConflictError("EVENT_ALREADY_CANCELLED");
        if (event.status === "FINISHED") throw new ConflictError("EVENT_FINISHED");

        try {
          await ctx.eventRepository.assignMember(eventId, memberId);
        } catch (error) {
          if (isPrismaUniqueViolation(error)) {
            return { id: memberId, alreadyPresent: true };
          }
          throw error;
        }

        return { id: memberId };
      });
    }

    try {
      const result = await this.criticalSection.execute(eventId, async (ctx) => {
        const event = await ctx.eventRepository.findById(eventId);
        if (!event) throw new NotFoundError("EVENT_NOT_FOUND");
        if (event.isDeleted) throw new ConflictError("EVENT_DELETED");
        if (event.status === "CANCELLED") throw new ConflictError("EVENT_ALREADY_CANCELLED");
        if (event.status === "FINISHED") throw new ConflictError("EVENT_FINISHED");

        try {
          const assignment = await ctx.assignmentRepository.create({ eventId, memberId, ministryId: ministryId! });

          const notificationResult = memberUserId
            ? await this.createNotification.execute(
                {
                  userId: memberUserId,
                  type: "MEMBRO_ESCALADO",
                  title: "Você foi escalado!",
                  message: `Você foi escalado para ${ministry!.name} no evento ${event.title ?? event.type} em ${event.startsAt.toLocaleDateString("pt-BR")}.`,
                  payload: {
                    eventId,
                    ministryId: ministryId!,
                    ministryName: ministry!.name,
                    eventTitle: event.title ?? "",
                    eventDate: event.startsAt.toISOString(),
                  },
                  deduplicationKey: `v1:membro-escalado:${assignment.id}`,
                },
                {
                  repository: ctx.notificationRepository,
                  recoverDeduplicationConflict: false,
                },
              )
            : null;

          return { assignment: { id: assignment.id }, notificationResult, memberPhone: member.phone, memberFullName: member.fullName, eventTitle: event.title ?? event.type, eventStartsAt: event.startsAt };
        } catch (error) {
          if (isPrismaUniqueViolation(error)) {
            return { alreadyAssigned: true };
          }
          throw error;
        }
      });

      if ("alreadyAssigned" in result) {
        const existing = await this.assignmentLookup.find(eventId, memberId, ministryId);
        if (!existing) {
          throw new ConflictError("ASSIGNMENT_UNIQUE_CONFLICT", undefined, "Erro inesperado ao verificar vínculo existente");
        }
        return { id: memberId, alreadyAssigned: true };
      }

      const { notificationResult, memberPhone, memberFullName, eventTitle, eventStartsAt } = result;

      if (memberUserId && notificationResult?.created) {
        this.realtimePublisher.publish(memberUserId, notificationResult.notification);

        if (memberPhone) {
          this.dispatchWhatsAppBestEffort({
            phone: memberPhone,
            message: `Oi ${memberFullName}! Você foi escalado para *${ministry!.name}* no evento *${eventTitle}* em ${eventStartsAt.toLocaleDateString("pt-BR")}.`,
          });
        }
      }

      return { id: memberId };
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        const existing = await this.assignmentLookup.find(eventId, memberId, ministryId);
        if (existing) return { id: memberId, alreadyAssigned: true };
      }
      throw error;
    }
  }

  private dispatchWhatsAppBestEffort(input: { phone: string; message: string }): void {
    try {
      void this.whatsApp
        .sendMessage(input.phone, input.message, "default")
        .then((result) => {
          if (!result.ok && result.code !== "NOT_CONFIGURED") {
            logger.warn(
              {
                operation: "event_assignment_whatsapp",
                errorCode: result.code,
                retryable: result.retryable,
                phone: maskPhone(input.phone),
              },
              "WhatsApp assignment was not accepted",
            );
          }
        })
        .catch((error: unknown) => {
          logger.error(
            {
              operation: "event_assignment_whatsapp",
              error,
            },
            "Unexpected WhatsApp assignment error",
          );
        });
    } catch (error: unknown) {
      logger.error(
        {
          operation: "event_assignment_whatsapp",
          error,
        },
        "WhatsApp assignment dispatch failed",
      );
    }
  }
}
