import pino from "pino";
import { getRequestId } from "./requestContext";

const isTestEnv = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

const redactPaths = [
  "cookies",
  "cookies[*]",
  "headers.cookie",
  "headers.authorization",
  "headers['x-api-key']",
  "headers.apikey",
  "req.headers.cookie",
  "req.headers.authorization",
  "req.headers.apikey",
  "req.body",
  "res.body",
  "body",
  "phone",
  "telefone",
  "token",
  "accessToken",
  "refreshToken",
  "password",
  "passwordHash",
  "qrcode",
  "base64",
  "email",
];

const baseLogger = pino({
  name: "voc-api",
  level: process.env.LOG_LEVEL ?? (isTestEnv ? "silent" : "info"),
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      path: req.path ?? req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isTestEnv && { enabled: false }),
});

export function createLogger(component?: string) {
  const requestId = getRequestId();
  const bindings: Record<string, string> = {};
  if (requestId !== "no-request-context") {
    bindings.requestId = requestId;
  }
  if (component) {
    bindings.component = component;
  }
  return baseLogger.child(bindings);
}

export { baseLogger };
