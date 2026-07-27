import { z } from "zod";
import { EventType } from "@prisma/client";

export const eventMonthSchema = z.number().int().min(1).max(12);
export const eventYearSchema = z.number().int().min(1).max(9999);
export const eventTypeSchema = z.nativeEnum(EventType);
