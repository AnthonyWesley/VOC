import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaEventRepository } from "../../domain/repositories/PrismaEventRepository";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase } from "../../../../__tests__/helpers";
import { generateId } from "../../../../shared/utils/generateId";

describe("0H.2B — Assignment concurrency (repository level)", () => {
  let prisma1: PrismaClient;
  let prisma2: PrismaClient;
  let repo1: PrismaEventRepository;
  let repo2: PrismaEventRepository;

  const eventId = generateId();
  const memberId = generateId();
  const ministryId = generateId();

  beforeAll(async () => {
    prisma1 = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    prisma2 = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma1);

    const now = new Date();
    await prisma1.member.create({
      data: { id: memberId, fullName: "Concurrency Member", normalizedFullName: "concurrency member", birthDate: now, churchJoinDate: now },
    });

    await prisma1.ministry.create({
      data: { id: ministryId, name: "Concurrency Ministry" },
    });

    await prisma1.event.create({
      data: {
        id: eventId,
        type: "SUNDAY_SERVICE",
        status: "SCHEDULED",
        startsAt: new Date("2026-08-02T08:00:00Z"),
        attendanceMode: "SUMMARY",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    repo1 = new PrismaEventRepository(prisma1);
    repo2 = new PrismaEventRepository(prisma2);
  });

  afterAll(async () => {
    await prisma1.$disconnect();
    await prisma2.$disconnect();
  });

  it("concurrent assignAssignment → only one EventAssignment persists", async () => {
    const results = await Promise.allSettled([
      repo1.assignAssignment(eventId, memberId, ministryId),
      repo2.assignAssignment(eventId, memberId, ministryId),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.filter((r) => r.status === "rejected").length;

    expect(fulfilled).toBe(1);
    expect(rejected).toBe(1);

    const count = await prisma1.eventAssignment.count({
      where: { eventId, memberId, ministryId },
    });
    expect(count).toBe(1);
  });

  it("concurrent assignMember (attendance) → only one EventMember persists", async () => {
    const results = await Promise.allSettled([
      repo1.assignMember(eventId, memberId),
      repo2.assignMember(eventId, memberId),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.filter((r) => r.status === "rejected").length;

    expect(fulfilled).toBe(1);
    expect(rejected).toBe(1);

    const count = await prisma1.eventMember.count({
      where: { eventId, memberId },
    });
    expect(count).toBe(1);
  });
});
