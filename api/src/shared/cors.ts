import { CorsOptions } from "cors";

const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
];

export function parseCorsOrigins(raw?: string): string[] {
  if (!raw) return DEFAULT_ORIGINS;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function createCorsOptions(origins?: string[]): CorsOptions {
  const allowed = origins ?? DEFAULT_ORIGINS;

  return {
    origin: (origin, callback) => {
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  };
}
