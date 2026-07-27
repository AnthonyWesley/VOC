import { z } from "zod";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { ulidSchema } from "../../../../shared/utils/ulidSchema";

export type EventCursor = {
  startsAt: string;
  id: string;
};

const base64UrlSchema = z.string().min(1).max(1024).regex(/^[A-Za-z0-9_-]+$/);

const eventCursorSchema = z
  .object({
    startsAt: z.string().datetime(),
    id: ulidSchema,
  })
  .strict();

export function encodeEventCursor(input: EventCursor): string {
  const parsed = eventCursorSchema.parse(input);
  return Buffer.from(JSON.stringify(parsed)).toString("base64url");
}

export function decodeEventCursor(raw: string): EventCursor {
  const rawResult = base64UrlSchema.safeParse(raw);
  if (!rawResult.success) {
    throw new ValidationError("INVALID_CURSOR");
  }

  let parsed: unknown;

  try {
    const decoded = Buffer.from(rawResult.data, "base64url").toString("utf8");
    parsed = JSON.parse(decoded);
  } catch {
    throw new ValidationError("INVALID_CURSOR");
  }

  const cursorResult = eventCursorSchema.safeParse(parsed);
  if (!cursorResult.success) {
    throw new ValidationError("INVALID_CURSOR");
  }

  return cursorResult.data;
}
