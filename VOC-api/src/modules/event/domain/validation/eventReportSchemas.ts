import { z } from "zod";
import { eventMonthSchema, eventYearSchema, eventTypeSchema } from "./eventDateSchemas";

const decimal = z.string().regex(/^\d+$/).transform(Number);

export const monthlyReportHttpSchema = z.object({
  month: decimal.pipe(eventMonthSchema).optional(),
  year: decimal.pipe(eventYearSchema).optional(),
  type: eventTypeSchema.optional(),
});

export const monthlyReportInputSchema = z.object({
  month: eventMonthSchema.optional(),
  year: eventYearSchema.optional(),
  type: eventTypeSchema.optional(),
});
