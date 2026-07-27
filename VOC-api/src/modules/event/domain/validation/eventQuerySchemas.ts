import { z } from "zod";
import { EventType } from "@prisma/client";

export const limitNumber = z.number().int().min(1).max(200);
export const monthNumber = z.number().int().min(1).max(12);
export const yearNumber = z.number().int().min(100).max(9999);
export const eventTypeEnum = z.nativeEnum(EventType);

const decimalToNumber = z.string().regex(/^\d+$/).transform(Number);

export const listEventsHttpSchema = z.object({
  limit: decimalToNumber.pipe(limitNumber).default(20),
  month: decimalToNumber.pipe(monthNumber).optional(),
  year: decimalToNumber.pipe(yearNumber).optional(),
  type: eventTypeEnum.optional(),
  cursor: z.string().optional(),
});

export const listEventsInputSchema = z.object({
  limit: limitNumber.default(20),
  month: monthNumber.optional(),
  year: yearNumber.optional(),
  type: eventTypeEnum.optional(),
  cursor: z.string().optional(),
});
