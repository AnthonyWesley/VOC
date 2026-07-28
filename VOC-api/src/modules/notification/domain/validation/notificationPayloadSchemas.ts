import { z } from "zod";
import { ulidSchema } from "../../../../shared/utils/ulidSchema";

export const notificationPayloadSchemas = {
  MEMBER_AUSENTE: {
    1: z.object({
      memberId: ulidSchema,
      memberName: z.string().min(1),
      eventType: z.string(),
      daysSinceLastEvent: z.number().int().nonnegative(),
    }).strict(),
  },
  MEMBRO_VINCULADO: {
    1: z.object({
      memberId: ulidSchema,
      memberName: z.string().min(1),
    }).strict(),
  },
  MEMBRO_REMOVIDO: {
    1: z.object({
      eventId: ulidSchema,
      memberId: ulidSchema,
      ministryName: z.string().min(1),
      eventTitle: z.string(),
      eventDate: z.string(),
    }).strict(),
  },
  EVENTO_CRIADO: {
    1: z.object({
      eventId: ulidSchema,
      eventTitle: z.string(),
      eventType: z.string(),
      needsScale: z.boolean(),
    }).strict(),
  },
  MEMBRO_ESCALADO: {
    1: z.object({
      eventId: ulidSchema,
      ministryId: ulidSchema,
      ministryName: z.string().min(1),
      eventTitle: z.string(),
      eventDate: z.string().datetime(),
    }).strict(),
  },
  MEMBRO_DESVINCULADO: {
    1: z.object({
      memberId: ulidSchema,
      memberName: z.string().min(1),
      ministryId: ulidSchema,
      ministryName: z.string().min(1),
    }).strict(),
  },
} as const;

export type NotificationPayloadType = keyof typeof notificationPayloadSchemas;

export function validateNotificationPayload(
  type: NotificationPayloadType,
  payload: unknown,
  version: number = 1,
): Record<string, unknown> {
  const versioned = (notificationPayloadSchemas[type] as any)?.[version];
  if (!versioned) {
    throw new Error(`Unknown notification payload schema: ${type} v${version}`);
  }
  return versioned.parse(payload) as Record<string, unknown>;
}
