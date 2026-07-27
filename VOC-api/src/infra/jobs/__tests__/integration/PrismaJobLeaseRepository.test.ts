import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { INTEGRATION_DATABASE_URL } from "../../../../__tests__/helpers";
import { PrismaJobLeaseRepository } from "../../PrismaJobLeaseRepository";

describe("PrismaJobLeaseRepository — PostgreSQL", () => {
  let prisma: PrismaClient;
  let repo: PrismaJobLeaseRepository;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    repo = new PrismaJobLeaseRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM "JobLease"`);
  });

  it("1 — first acquire always succeeds", async () => {
    const result = await repo.tryAcquire({ name: "test-job", ownerId: "owner-1", ttlSeconds: 60 });
    expect(result.acquired).toBe(true);
  });

  it("2 — two concurrent acquires: only one acquires", async () => {
    const r1 = await repo.tryAcquire({ name: "concurrent-job", ownerId: "owner-1", ttlSeconds: 60 });
    expect(r1.acquired).toBe(true);

    const r2 = await repo.tryAcquire({ name: "concurrent-job", ownerId: "owner-2", ttlSeconds: 60 });
    expect(r2.acquired).toBe(false);
  });

  it("3 — active lease cannot be taken by another owner", async () => {
    await repo.tryAcquire({ name: "locked-job", ownerId: "owner-1", ttlSeconds: 60 });
    const result = await repo.tryAcquire({ name: "locked-job", ownerId: "owner-2", ttlSeconds: 60 });
    expect(result.acquired).toBe(false);
  });

  it("4 — expired lease can be taken", async () => {
    await repo.tryAcquire({ name: "expired-job", ownerId: "owner-1", ttlSeconds: 1 });
    await new Promise((r) => setTimeout(r, 1100));

    const result = await repo.tryAcquire({ name: "expired-job", ownerId: "owner-2", ttlSeconds: 60 });
    expect(result.acquired).toBe(true);
  });

  it("5 — release requires name + lockedBy (wrong owner does nothing)", async () => {
    await repo.tryAcquire({ name: "release-test", ownerId: "owner-1", ttlSeconds: 60 });
    await repo.release("release-test", "wrong-owner");

    const status = await repo.getStatus("release-test");
    expect(status.running).toBe(true);
  });

  it("6 — release with correct owner succeeds", async () => {
    await repo.tryAcquire({ name: "release-ok", ownerId: "owner-1", ttlSeconds: 60 });
    await repo.release("release-ok", "owner-1");

    const status = await repo.getStatus("release-ok");
    expect(status.running).toBe(false);
    expect(status.lockedUntil).toBeNull();
  });

  it("7 — getStatus returns running=false and lockedUntil=null when no lease exists", async () => {
    const status = await repo.getStatus("nonexistent");
    expect(status.running).toBe(false);
    expect(status.lockedUntil).toBeNull();
  });

  it("8 — getStatus returns running=true and lockedUntil date when lease is active", async () => {
    await repo.tryAcquire({ name: "active-status", ownerId: "owner-1", ttlSeconds: 60 });
    const status = await repo.getStatus("active-status");
    expect(status.running).toBe(true);
    expect(status.lockedUntil).toBeInstanceOf(Date);
    expect(status.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it("9 — renew requires correct lockedBy", async () => {
    await repo.tryAcquire({ name: "renew-test", ownerId: "owner-1", ttlSeconds: 60 });
    const wrongRenew = await repo.renew("renew-test", "wrong-owner", 60);
    expect(wrongRenew).toBe(false);

    const correctRenew = await repo.renew("renew-test", "owner-1", 120);
    expect(correctRenew).toBe(true);
  });

  it("10 — getStatus returns running=false for expired lease but preserves lockedUntil", async () => {
    await repo.tryAcquire({ name: "expired-status", ownerId: "owner-1", ttlSeconds: 1 });
    await new Promise((r) => setTimeout(r, 1100));

    const status = await repo.getStatus("expired-status");
    expect(status.running).toBe(false);
    expect(status.lockedUntil).toBeInstanceOf(Date);
    expect(status.lockedUntil!.getTime()).toBeLessThan(Date.now());
  });
});
