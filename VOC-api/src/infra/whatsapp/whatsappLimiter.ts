import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const whatsappAdminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).currentUser?.userId;
    if (userId) return `user:${userId}`;
    return ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? "unknown");
  },
  message: { code: "RATE_LIMITED", message: "Too many WhatsApp operations. Try again later." },
});
