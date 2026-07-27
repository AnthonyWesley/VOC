import { PrismaClient } from "@prisma/client";
import { AcquireLeaseInput, AcquireLeaseResult, IJobLeaseRepository, JobLeaseStatus } from "./IJobLeaseRepository";

const ACQUIRE_SQL = `
INSERT INTO "JobLease" ("name", "lockedBy", "lockedUntil", "updatedAt")
VALUES ($1, $2, NOW() + make_interval(secs => $3), NOW())
ON CONFLICT ("name") DO UPDATE
SET
  "lockedBy" = EXCLUDED."lockedBy",
  "lockedUntil" = EXCLUDED."lockedUntil",
  "updatedAt" = NOW()
WHERE "JobLease"."lockedUntil" <= NOW()
RETURNING "name"
`;

const RELEASE_SQL = `
DELETE FROM "JobLease"
WHERE "name" = $1 AND "lockedBy" = $2
`;

const RENEW_SQL = `
UPDATE "JobLease"
SET "lockedUntil" = NOW() + make_interval(secs => $3), "updatedAt" = NOW()
WHERE "name" = $1 AND "lockedBy" = $2
RETURNING "name"
`;

const STATUS_SQL = `
SELECT
  "lockedUntil" > NOW() AS "running",
  "lockedUntil"
FROM "JobLease"
WHERE "name" = $1
`;

export class PrismaJobLeaseRepository implements IJobLeaseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async tryAcquire(input: AcquireLeaseInput): Promise<AcquireLeaseResult> {
    const result = await this.prisma.$queryRawUnsafe<{ name: string }[]>(
      ACQUIRE_SQL,
      input.name,
      input.ownerId,
      input.ttlSeconds,
    );
    return { acquired: result.length > 0 };
  }

  async release(name: string, ownerId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(RELEASE_SQL, name, ownerId);
  }

  async renew(name: string, ownerId: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.prisma.$queryRawUnsafe<{ name: string }[]>(
      RENEW_SQL,
      name,
      ownerId,
      ttlSeconds,
    );
    return result.length > 0;
  }

  async getStatus(name: string): Promise<JobLeaseStatus> {
    const rows = await this.prisma.$queryRawUnsafe<{ running: boolean; lockedUntil: Date | null }[]>(
      STATUS_SQL,
      name,
    );
    if (rows.length === 0) {
      return { running: false, lockedUntil: null };
    }
    return { running: rows[0].running, lockedUntil: rows[0].lockedUntil };
  }
}
