import { PrismaClient } from "@prisma/client";
import { INotificationRepository } from "../domain/repositories/INotificationRepository";
import { CreateNotificationUseCase } from "./CreateNotificationUseCase";
import { IWhatsAppService } from "../../../infra/whatsapp/IWhatsAppService";
import { createLogger } from "../../../shared/logger/logger";
import { maskPhone } from "../../../shared/types/whatsapp";

const INACTIVE_DAYS = 30;
const INACTIVE_MS = INACTIVE_DAYS * 86_400_000;

export class NotifyInactiveMembersUseCase {
  private logger = createLogger("notify-inactive-members");

  constructor(
    private readonly prisma: PrismaClient,
    private readonly notificationRepo: INotificationRepository,
    private readonly createNotification: CreateNotificationUseCase,
    private readonly whatsApp?: IWhatsAppService,
  ) {}

  async execute(): Promise<void> {
    const eventTypes = ["HOUSE_SERVICE", "SUNDAY_SERVICE", "PRAYER_MEETING", "BIBLE_STUDY", "YOUTH_NIGHT", "SPECIAL_EVENT"] as const;

    const adminUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        roles: { some: { role: { level: { gte: 80 } } } },
      },
      select: { id: true },
    });

    if (adminUsers.length === 0) return;

    const eventTypeLabels: Record<string, string> = {
      HOUSE_SERVICE: "Culto em Casa",
      SUNDAY_SERVICE: "Culto de Domingo",
      PRAYER_MEETING: "Oração",
      BIBLE_STUDY: "Estudo Bíblico",
      YOUTH_NIGHT: "Encontro de Jovens",
      SPECIAL_EVENT: "Evento Especial",
    };

    const thresholdDate = new Date(Date.now() - INACTIVE_MS);
    const thirtyDaysAgo = new Date(Date.now() - INACTIVE_MS);

    let whatsappAccepted = 0;
    let whatsappFailed = 0;

    for (const type of eventTypes) {
      const inactiveMembers = await this.prisma.member.findMany({
        where: {
          deletedAt: null,
          events: { some: { event: { type } } },
          NOT: {
            events: {
              some: {
                event: {
                  type,
                  startsAt: { gte: thresholdDate },
                },
              },
            },
          },
        },
        select: {
          id: true,
          fullName: true,
          phone: true,
          events: {
            where: { event: { type } },
            select: { event: { select: { startsAt: true } } },
            orderBy: { event: { startsAt: "desc" } },
            take: 1,
          },
        },
      });

      for (const member of inactiveMembers) {
        const lastEvent = member.events[0]?.event.startsAt;
        const daysSince = lastEvent
          ? Math.floor((Date.now() - new Date(lastEvent).getTime()) / 86_400_000)
          : 999;

        for (const admin of adminUsers) {
          const recentCount = await this.prisma.notification.count({
            where: {
              userId: admin.id,
              type: "MEMBER_AUSENTE",
              createdAt: { gte: thirtyDaysAgo },
              payload: {
                path: ["memberId"],
                equals: member.id,
              },
            },
          });

          if (recentCount === 0) {
            await this.createNotification.execute({
              userId: admin.id,
              type: "MEMBER_AUSENTE",
              title: `Membro ausente — ${member.fullName}`,
              message: `${member.fullName} não participa de ${eventTypeLabels[type]} há ${daysSince} dias.`,
              payload: {
                memberId: member.id,
                memberName: member.fullName,
                eventType: type,
                daysSinceLastEvent: daysSince,
              },
            });
          }
        }

        if (member.phone) {
          const result = await this.whatsApp!.sendMessage(
            member.phone,
            `Oi ${member.fullName}! Sentimos sua falta nos nossos encontros. Já fazem ${daysSince} dias desde sua última participação, e queremos muito te ver novamente. Sua presença faz diferença na nossa comunidade!`,
            "default",
          );

          if (result.ok) {
            whatsappAccepted++;
          } else {
            whatsappFailed++;
            if (result.code === "NOT_CONFIGURED") {
              this.logger.debug({ operation: "whatsapp_send", resultCode: "NOT_CONFIGURED" }, "WhatsApp not configured");
            } else {
              this.logger.warn({ operation: "whatsapp_send", resultCode: result.code, retryable: result.retryable, phone: maskPhone(member.phone) }, "WhatsApp message was not accepted");
            }
          }
        }
      }
    }

    this.logger.info({ operation: "inactive_members_job", whatsappAccepted, whatsappFailed }, "WhatsApp delivery summary");
  }
}
