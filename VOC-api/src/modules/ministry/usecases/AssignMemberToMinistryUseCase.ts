import { PrismaClient } from "@prisma/client";
import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";
import { IMinistryMembershipTransaction } from "../domain/transactions/IMinistryMembershipTransaction";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { isPrismaUniqueViolation } from "../../../shared/utils/isPrismaUniqueViolation";
import { CreateNotificationUseCase } from "../../notification/usecases/CreateNotificationUseCase";
import { IRealtimeNotificationPublisher } from "../../../infra/socket/RealtimeNotificationPublisher";
import { IWhatsAppService } from "../../../infra/whatsapp/IWhatsAppService";
import { createLogger } from "../../../shared/logger/logger";
import { maskPhone } from "../../../shared/types/whatsapp";

type NotificationResult = Awaited<ReturnType<CreateNotificationUseCase["execute"]>>;

const logger = createLogger("assign-member-ministry");

export type AssignMemberToMinistryInput = {
  ministryId: string;
  memberId: string;
  userId: string;
  userLevel: number;
};

export type AssignMemberToMinistryOutput = {
  id: string;
  alreadyAssigned?: boolean;
};

class MembershipUniqueConflictError extends Error {
  constructor(public readonly cause: unknown) {
    super("MEMBERSHIP_UNIQUE_CONFLICT");
    this.name = "MembershipUniqueConflictError";
  }
}

export class AssignMemberToMinistryUseCase {
  constructor(
    private readonly transaction: IMinistryMembershipTransaction,
    private readonly ministryRepository: IMinistryRepository,
    private readonly prisma: PrismaClient,
    private readonly createNotification: CreateNotificationUseCase,
    private readonly realtimePublisher: IRealtimeNotificationPublisher,
    private readonly whatsApp: IWhatsAppService,
  ) {}

  async execute(
    input: AssignMemberToMinistryInput,
  ): Promise<AssignMemberToMinistryOutput> {
    const { ministryId, memberId, userId, userLevel } = input;

    const [ministryAggregate, member, user] = await Promise.all([
      this.ministryRepository.findById(ministryId),
      this.prisma.member.findUnique({
        where: { id: memberId },
        select: { id: true, fullName: true, userId: true, phone: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { member: { select: { id: true } } },
      }),
    ]);

    const ministry = ministryAggregate
      ? { id: ministryAggregate.id, name: ministryAggregate.name, leaderId: ministryAggregate.leaderId }
      : null;

    if (!ministry) throw new NotFoundError("MINISTRY_NOT_FOUND");
    if (!member) throw new NotFoundError("MEMBER_NOT_FOUND");

    const isLeader = user?.member?.id && user.member.id === ministry.leaderId;
    if (!isLeader && userLevel < 80) {
      throw new ForbiddenError("NOT_MINISTRY_LEADER", undefined, "Você não é líder deste ministério");
    }

    let notificationResult: NotificationResult = { notification: null as any, created: false };

    try {
      await this.transaction.execute<void>(async ({ memberships, notifications }) => {
        try {
          await memberships.create({ memberId, ministryId });
        } catch (error: unknown) {
          if (isPrismaUniqueViolation(error)) {
            throw new MembershipUniqueConflictError(error);
          }
          throw error;
        }

        if (member.userId) {
          const result = await this.createNotification.execute(
            {
              userId: member.userId,
              type: "MEMBRO_VINCULADO",
              title: "Você foi vinculado a um ministério",
              message: `Você foi vinculado ao ministério ${ministry.name}.`,
              payload: {
                memberId,
                memberName: member.fullName,
              },
              deduplicationKey: `v1:membro-vinculado:${memberId}:${ministryId}`,
            },
            {
              repository: notifications,
              recoverDeduplicationConflict: false,
            },
          );
          notificationResult = result;
        }
      });
    } catch (error: unknown) {
      if (error instanceof MembershipUniqueConflictError) {
        return { id: memberId, alreadyAssigned: true };
      }
      throw error;
    }

    if (member.userId && notificationResult.created) {
      this.realtimePublisher.publish(member.userId, notificationResult.notification);

      if (member.phone) {
        this.dispatchWhatsAppBestEffort({
          phone: member.phone,
          message: `Olá ${member.fullName}! Você foi vinculado ao ministério *${ministry.name}*.`,
        });
      }
    }

    return { id: memberId };
  }

  private dispatchWhatsAppBestEffort(input: { phone: string; message: string }): void {
    try {
      void this.whatsApp
        .sendMessage(input.phone, input.message, "default")
        .then((result) => {
          if (!result.ok && result.code !== "NOT_CONFIGURED") {
            logger.warn(
              { operation: "ministry_assignment_whatsapp", errorCode: result.code, retryable: result.retryable, phone: maskPhone(input.phone) },
              "WhatsApp assignment was not accepted",
            );
          }
        })
        .catch((error: unknown) => {
          logger.error({ operation: "ministry_assignment_whatsapp", error }, "Unexpected WhatsApp assignment error");
        });
    } catch (error: unknown) {
      logger.error({ operation: "ministry_assignment_whatsapp", error }, "WhatsApp assignment dispatch failed");
    }
  }
}
