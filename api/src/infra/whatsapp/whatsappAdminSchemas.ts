import { z } from "zod";

export const instanceNameSchema = z.string().trim().min(1).max(100);

export const createInstanceHttpSchema = z.object({ instanceName: instanceNameSchema }).strict();

export const instanceParamsSchema = z.object({ instanceName: instanceNameSchema }).strict();

export const evolutionQrCodeResponseSchema = z
  .object({
    base64: z.string().min(1).optional(),
    qrcode: z.string().min(1).optional(),
    pairingCode: z.string().min(1).optional(),
  })
  .passthrough()
  .refine(
    (v) => v.base64 !== undefined || v.qrcode !== undefined || v.pairingCode !== undefined,
    { message: "INVALID_PROVIDER_RESPONSE" },
  );

export const evolutionConnectionStateResponseSchema = z
  .object({
    instance: z.object({
      state: z.string().min(1),
    }),
  })
  .passthrough();

export const evolutionCreateInstanceResponseSchema = z
  .object({
    instance: z
      .object({
        instanceName: z.string().min(1),
      })
      .optional(),
    base64: z.string().optional(),
    qrcode: z
      .object({
        pairingCode: z.string(),
      })
      .optional(),
  })
  .passthrough()
  .refine(
    (v) => v.instance !== undefined || v.base64 !== undefined,
    { message: "INVALID_PROVIDER_RESPONSE" },
  );

export const evolutionDeleteResponseSchema = z.object({}).passthrough().optional();
