import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { requestContextStorage } from "./requestContext";

const VALID_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidRequestId(value: unknown): value is string {
  return typeof value === "string" && VALID_UUID_RE.test(value);
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers["x-request-id"];
  const requestId = isValidRequestId(incoming) ? incoming : crypto.randomUUID();

  res.setHeader("X-Request-Id", requestId);

  requestContextStorage.run({ requestId }, () => {
    next();
  });
}
