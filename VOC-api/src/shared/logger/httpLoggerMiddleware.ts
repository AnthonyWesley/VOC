import { Request, Response, NextFunction } from "express";
import { createLogger } from "./logger";

export function httpLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const logger = createLogger("http");
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level]({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
    }, `${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`);
  });

  next();
}
