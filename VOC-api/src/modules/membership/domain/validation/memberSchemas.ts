import { z } from "zod";

// ── Helpers ──────────────────────────────────────────────

const ulidOrString = z.string().min(1);

function isValidCalendarDate(val: string): boolean {
  const m = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

// ── Date fields (string → Date) ─────────────────────────

const dateField = z
  .string()
  .min(1, "Data é obrigatória")
  .refine(isValidCalendarDate, { message: "Data inválida" })
  .refine((val) => new Date(val + "T00:00:00Z") <= new Date(), {
    message: "Data não pode ser futura",
  })
  .transform((val) => new Date(val + "T00:00:00Z"));

const dateFieldOptional = dateField.optional();

// ── Phone ────────────────────────────────────────────────

const phoneField = z.string().trim().min(1).optional();

// ── HTTP schemas (strict, no admin fields) ───────────────

export const registerMemberHttpSchema = z
  .object({
    fullName: z.string().trim().min(1, "O nome completo é obrigatório"),
    nickname: z.string().trim().optional(),
    birthDate: dateField,
    phone: phoneField,
    postcode: z.string().trim().optional(),
    address: z.string().trim().optional(),
    baptismDate: dateFieldOptional,
    churchJoinDate: dateFieldOptional,
  })
  .strict();

export const completeProfileHttpSchema = z
  .object({
    fullName: z.string().trim().min(1, "O nome completo é obrigatório"),
    nickname: z.string().trim().optional(),
    birthDate: dateField,
    phone: phoneField,
    postcode: z.string().trim().optional(),
    address: z.string().trim().optional(),
  })
  .strict();

export const createMemberHttpSchema = z.object({
  fullName: z.string().trim().min(1, "O nome completo é obrigatório"),
  nickname: z.string().trim().optional(),
  birthDate: dateField,
  phone: phoneField,
  postcode: z.string().trim().optional(),
  address: z.string().trim().optional(),
  baptismDate: dateFieldOptional,
  churchJoinDate: dateFieldOptional,
});

export const updateMemberHttpSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  nickname: z.string().trim().optional(),
  birthDate: dateFieldOptional,
  phone: phoneField,
  postcode: z.string().trim().optional(),
  address: z.string().trim().optional(),
  baptismDate: dateFieldOptional,
  churchJoinDate: dateFieldOptional,
  status: z.enum(["ACTIVE", "INACTIVE", "VISITOR", "TRANSFERRED"]).optional(),
});

// ── List query (discriminated union) ─────────────────────

const limitSchema = z.coerce.number().int().min(1).max(200).default(20);
const cursorSchema = z.string().optional();
const searchSchema = z.string().optional();
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "VISITOR", "TRANSFERRED"]).optional();

export const listMembersQuerySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("all"),
    limit: limitSchema.optional(),
    cursor: cursorSchema,
    search: searchSchema,
    status: statusSchema,
  }),
  z.object({
    mode: z.literal("event"),
    eventId: ulidOrString,
    limit: limitSchema.optional(),
    cursor: cursorSchema,
    search: searchSchema,
    status: statusSchema,
  }),
  z.object({
    mode: z.literal("ministry"),
    ministryId: ulidOrString,
    limit: limitSchema.optional(),
    cursor: cursorSchema,
    search: searchSchema,
    status: statusSchema,
  }),
  z.object({
    mode: z.literal("assignment"),
    eventId: ulidOrString,
    ministryId: ulidOrString,
    limit: limitSchema.optional(),
    cursor: cursorSchema,
    search: searchSchema,
    status: statusSchema,
  }),
]);

// ── Use-case input schemas (already date) ────────────────

export const registerMemberInputSchema = z.object({
  fullName: z.string().min(1),
  nickname: z.string().optional(),
  birthDate: z.date(),
  phone: z.string().optional(),
  postcode: z.string().optional(),
  address: z.string().optional(),
  baptismDate: z.date().optional(),
  churchJoinDate: z.date().optional(),
  userId: z.string().optional(),
});

export const createMemberInputSchema = z.object({
  fullName: z.string().min(1),
  nickname: z.string().optional(),
  birthDate: z.date(),
  phone: z.string().optional(),
  postcode: z.string().optional(),
  address: z.string().optional(),
  baptismDate: z.date().optional(),
  churchJoinDate: z.date().optional(),
});

export const completeProfileInputSchema = z.object({
  fullName: z.string().min(1),
  nickname: z.string().optional(),
  birthDate: z.date(),
  phone: z.string().optional(),
  postcode: z.string().optional(),
  address: z.string().optional(),
  churchJoinDate: z.date(),
  userId: z.string(),
});
