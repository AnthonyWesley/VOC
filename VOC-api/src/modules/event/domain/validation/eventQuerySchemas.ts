import { z } from "zod";
import { eventMonthSchema, eventYearSchema, eventTypeSchema } from "./eventDateSchemas";

export const limitNumber = z.number().int().min(1).max(200);

const decimalToNumber = z.string().regex(/^\d+$/).transform(Number);

export const listEventsHttpSchema = z.object({
  limit: decimalToNumber.pipe(limitNumber).default(20),
  month: decimalToNumber.pipe(eventMonthSchema).optional(),
  year: decimalToNumber.pipe(eventYearSchema).optional(),
  type: eventTypeSchema.optional(),
  cursor: z.string().optional(),
});

export const listEventsInputSchema = z.object({
  limit: limitNumber.default(20),
  month: eventMonthSchema.optional(),
  year: eventYearSchema.optional(),
  type: eventTypeSchema.optional(),
  cursor: z.string().optional(),
});
