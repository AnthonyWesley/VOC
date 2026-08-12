import { PrismaClient } from "@prisma/client";
import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";
import { IMinistryMembershipTransaction } from "../domain/transactions/IMinistryMembershipTransaction";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { CreateNotificationUseCase } from "../../notification/usecases/CreateNotificationUseCase";
import { IRealtimeNotificationPublisher } from "../../../infra/socket/RealtimeNotificationPublisher";
import { IWhatsAppService } from "../../../infra/whatsapp/IWhatsAppService";
import { createLogger } from "../../../shared/logger/logger";
import { maskPhone } from "../../../shared/types/whatsapp";

type NotificationResult = Awaited<ReturnType<CreateNotificationUseCase["execute"]>>;

const logger = createLogger("remove-member-ministry");

export type RemoveMemberFromMinistryInput = {
  ministryId: string;
  memberId: string;
  userId: string;
  userLevel: number;
};

export type RemoveMemberFromMinistryOutput = {
  id: string;
};

export class RemoveMemberFromMinistryUseCase {
  constructor(
    private readonly transaction: IMinistryMembershipTransaction,
    private readonly ministryRepository: IMinistryRepository,
    private readonly prisma: PrismaClient,
    private readonly createNotification: CreateNotificationUseCase,
    private readonly realtimePublisher: IRealtimeNotificationPublisher,
    private readonly whatsApp: IWhatsAppService,
  ) {}

  async execute(
    input: RemoveMemberFromMinistryInput,
  ): Promise<RemoveMemberFromMinistryOutput> {
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

    const existing = await this.prisma.memberMinistry.findUnique({
      where: { memberId_ministryId: { memberId, ministryId } },
    });

    if (!existing) {
      return { id: memberId };
    }

    let notificationResult: NotificationResult = { notification: null as any, created: false };

    await this.transaction.execute<void>(async ({ memberships, notifications }) => {
      await memberships.delete(memberId, ministryId);

      if (member.userId) {
        const result = await this.createNotification.execute(
          {
            userId: member.userId,
            type: "MEMBRO_DESVINCULADO",
            title: "Você foi desvinculado de um ministério",
            message: `Você foi desvinculado do ministério ${ministry.name}.`,
            payload: {
              memberId,
              memberName: member.fullName,
              ministryId,
              ministryName: ministry.name,
            },
            deduplicationKey: `v1:membro-desvinculado:${memberId}:${ministryId}`,
          },
          {
            repository: notifications,
            recoverDeduplicationConflict: false,
          },
        );
      }
    });

    if (member.userId && notificationResult.created) {
      this.realtimePublisher.publish(member.userId, notificationResult.notification);

      if (member.phone) {
        this.dispatchWhatsAppBestEffort({
          phone: member.phone,
          message: `Olá ${member.fullName}! Você foi desvinculado do ministério *${ministry.name}*.`,
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
              { operation: "ministry_removal_whatsapp", errorCode: result.code, retryable: result.retryable, phone: maskPhone(input.phone) },
              "WhatsApp removal was not accepted",
            );
          }
        })
        .catch((error: unknown) => {
          logger.error({ operation: "ministry_removal_whatsapp", error }, "Unexpected WhatsApp removal error");
        });
    } catch (error: unknown) {
      logger.error({ operation: "ministry_removal_whatsapp", error }, "WhatsApp removal dispatch failed");
    }
  }
}
