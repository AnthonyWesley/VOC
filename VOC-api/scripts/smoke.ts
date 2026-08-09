import "dotenv/config";
import { PrismaClient } from "@prisma/client";

type SmokeConfig = {
  baseUrl: string;
};

const config: SmokeConfig = {
  baseUrl: process.env.SMOKE_BASE_URL ?? process.env.API_URL ?? "http://127.0.0.1:3333",
};

let failures = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${message}`);
  }
}

async function main(): Promise<void> {
  console.log(`Smoke testing ${config.baseUrl}\n`);

  // ── Liveness / Readiness ────────────────────────────────────────────
  console.log("[health]");
  const live = await fetch(`${config.baseUrl}/health/live`);
  assert(live.ok, "GET /health/live -> 2xx");

  const ready = await fetch(`${config.baseUrl}/health/ready`);
  const readyBody = await ready.json();
  assert(ready.ok, "GET /health/ready -> 2xx");
  assert(readyBody.status === "ok" || readyBody.status === "degraded", "ready reports ok/degraded");
  assert(readyBody.dependencies?.database === "up", "database dependency is up");

  // ── Migrations applied (tables exist) ───────────────────────────────
  console.log("[database]");
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRawUnsafe(`SELECT 1`);
    assert(true, "SELECT 1 via Prisma");
    const authTable = await prisma.$queryRawUnsafe(
      `SELECT to_regclass('public."User"') IS NOT NULL AS exists`,
    ) as Array<{ exists: boolean }>;
    assert(authTable[0].exists === true, "User table exists (migrations applied)");
    const restoreLog = await prisma.$queryRawUnsafe(
      `SELECT to_regclass('public."MinistryRestoreLog"') IS NOT NULL AS exists`,
    ) as Array<{ exists: boolean }>;
    assert(restoreLog[0].exists === true, "MinistryRestoreLog table exists (latest migration applied)");
  } finally {
    await prisma.$disconnect();
  }

  // ── Public endpoint without auth ────────────────────────────────────
  console.log("[api]");
  const publicGet = await fetch(`${config.baseUrl}/members/${"00000000000000000000000000"}`);
  assert(publicGet.status === 401, "GET /members/:id without auth -> 401");

  if (failures > 0) {
    console.error(`\nSmoke failed with ${failures} failure(s)`);
    process.exit(1);
  }

  console.log("\nSmoke passed");
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error("Smoke failed with an unexpected error", error);
  process.exit(1);
});