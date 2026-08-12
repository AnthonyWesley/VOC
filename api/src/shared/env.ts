import { createLogger } from "./logger/logger";

const logger = createLogger("env");

export type ParsedEnv = {
  port: number;
  cronEnabled: boolean;
  jwtSecret: string | null;
  databaseUrl: string | null;
  corsOrigins: string | undefined;
  evolutionUrl: string | null;
  evolutionApiKey: string | null;
  instagramAccessToken: string | null;
  instagramUserId: string | null;
  instagramApiVersion: string;
  instagramMediaLimit: number;
};

export function validateEnv(env: NodeJS.ProcessEnv = process.env): ParsedEnv {
  const isProduction = env.NODE_ENV === "production";
  const errors: string[] = [];

  // ── PORT (strict parse) ─────────────────────────────────────────────
  let port = 3333;
  if (env.PORT !== undefined) {
    port = Number(env.PORT);
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      errors.push("PORT must be an integer between 0 and 65535");
    }
  }

  // ── CRON_ENABLED (strict parse) ─────────────────────────────────────
  let cronEnabled = false;
  if (env.CRON_ENABLED !== undefined) {
    const raw = env.CRON_ENABLED.trim().toLowerCase();
    if (raw === "true" || raw === "1") cronEnabled = true;
    else if (raw === "false" || raw === "0") cronEnabled = false;
    else errors.push("CRON_ENABLED must be true or false");
  }

  // ── Secrets / URLs: only required in production ─────────────────────
  const jwtSecret = env.JWT_SECRET ?? null;
  const databaseUrl = env.DATABASE_URL ?? null;

  if (isProduction) {
    if (!jwtSecret) {
      errors.push("JWT_SECRET is required in production");
    } else if (jwtSecret.length < 32) {
      errors.push("JWT_SECRET must be at least 32 characters");
    }

    if (!databaseUrl) {
      errors.push("DATABASE_URL is required in production");
    } else if (databaseUrl.startsWith("file:")) {
      errors.push("DATABASE_URL must point to PostgreSQL in production (file: URLs are not allowed)");
    }
  }

  // ── Evolution: API key required whenever URL is set ─────────────────
  const evolutionUrl = env.EVOLUTION_URL?.trim() || null;
  const evolutionApiKey = env.EVOLUTION_API_KEY?.trim() || null;

  if (evolutionUrl && !evolutionApiKey) {
    errors.push("EVOLUTION_API_KEY is required when EVOLUTION_URL is configured");
  }

  // ── Instagram Login (optional gallery) ──────────────────────────────
  const instagramAccessToken = env.INSTAGRAM_ACCESS_TOKEN?.trim() || null;
  const instagramUserId = env.INSTAGRAM_USER_ID?.trim() || null;

  if (instagramAccessToken && !instagramUserId) {
    errors.push("INSTAGRAM_USER_ID is required when INSTAGRAM_ACCESS_TOKEN is configured");
  }

  let instagramApiVersion = "v23.0";
  if (env.INSTAGRAM_API_VERSION !== undefined && env.INSTAGRAM_API_VERSION.trim() !== "") {
    const rawVersion = env.INSTAGRAM_API_VERSION.trim();
    if (!/^v\d+\.\d+$/.test(rawVersion)) {
      errors.push("INSTAGRAM_API_VERSION must follow the format vNN.N (e.g. v23.0)");
    } else {
      instagramApiVersion = rawVersion;
    }
  }

  let instagramMediaLimit = 12;
  if (env.INSTAGRAM_MEDIA_LIMIT !== undefined) {
    const rawLimit = Number(env.INSTAGRAM_MEDIA_LIMIT);
    if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100) {
      errors.push("INSTAGRAM_MEDIA_LIMIT must be an integer between 1 and 100");
    } else {
      instagramMediaLimit = rawLimit;
    }
  }

  if (errors.length > 0) {
    for (const message of errors) {
      logger.error({ message }, "Environment validation failed");
    }
    throw new Error(`Invalid environment configuration:\n  - ${errors.join("\n  - ")}`);
  }

  return {
    port,
    cronEnabled,
    jwtSecret,
    databaseUrl,
    corsOrigins: env.CORS_ORIGINS,
    evolutionUrl,
    evolutionApiKey,
    instagramAccessToken,
    instagramUserId,
    instagramApiVersion,
    instagramMediaLimit,
  };
}