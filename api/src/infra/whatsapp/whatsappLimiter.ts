import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request, RequestHandler } from "express";

export function whatsappAdminRateLimitKey(request: Request): string {
  const typed = request as Request & { auth?: { userId?: string } };
  const userId = typed.auth?.userId;
  if (userId) return `user:${userId}`;
  return `ip:${ipKeyGenerator(request.ip ?? "")}`;
}

export function createWhatsAppAdminLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: whatsappAdminRateLimitKey,
    handler: (_request: Request, response: any) => {
      response.status(429).json({
        code: "WHATSAPP_ADMIN_RATE_LIMITED",
        message: "Too many WhatsApp operations. Try again later.",
      });
    },
  });
}
