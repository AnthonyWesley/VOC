import { z } from "zod";
import { ulidSchema } from "../../../../shared/utils/ulidSchema";

export const ministryParamsSchema = z.object({
  ministryId: ulidSchema,
}).strict();

export const ministryMemberBodySchema = z.object({
  memberId: ulidSchema,
}).strict();

export const createMinistryHttpSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
}).strict();

export const updateMinistryHttpSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
}).strict().refine(
  (input) => Object.keys(input).length > 0,
  { message: "NO_CHANGES" },
);

export type CreateMinistryInput = z.infer<typeof createMinistryHttpSchema>;

export type UpdateMinistryInput = z.infer<typeof updateMinistryHttpSchema>;

export const assignMemberInputSchema = z.object({
  ministryId: ulidSchema,
  memberId: ulidSchema,
  userId: z.string(),
  userLevel: z.number(),
}).strict();

export const removeMemberInputSchema = z.object({
  ministryId: ulidSchema,
  memberId: ulidSchema,
  userId: z.string(),
  userLevel: z.number(),
}).strict();

export const deleteMinistryInputSchema = z.object({
  ministryId: ulidSchema,
}).strict();

export const getMinistryInputSchema = z.object({
  ministryId: ulidSchema,
}).strict();
