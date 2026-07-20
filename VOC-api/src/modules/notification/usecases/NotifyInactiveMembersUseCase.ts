import { PrismaClient } from "@prisma/client";
import { INotificationRepository } from "../domain/repositories/INotificationRepository";
import { CreateNotificationUseCase } from "./CreateNotificationUseCase";
import { IWhatsAppService } from "../../../infra/whatsapp/IWhatsAppService";

const INACTIVE_DAYS = 30;
const INACTIVE_MS = INACTIVE_DAYS * 86_400_000;
const thresholdDate = new Date(Date.now() - INACTIVE_MS);

export class NotifyInactiveMembersUseCase {
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
          const alreadyNotified = await this.notificationRepo.existsByTypeAndUserId(
            "MEMBER_AUSENTE",
            admin.id,
            member.id,
          );

          if (!alreadyNotified) {
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
          await this.whatsApp?.sendMessage(
            member.phone,
            `Oi ${member.fullName}! 💛 Sentimos sua falta nos nossos encontros. Já fazem ${daysSince} dias desde sua última participação, e queremos muito te ver novamente. Sua presença faz diferença na nossa comunidade!`,
            "default",
          ).catch(() => {});
        }
      }
    }
  }
}
