import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ulidSchema } from "../../../../shared/utils/ulidSchema";
import { generateId } from "../../../../shared/utils/generateId";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase } from "../../../../__tests__/helpers";
import { PrismaEventAssignmentRepository } from "../../infra/repositories/PrismaEventAssignmentRepository";
import { PrismaEventRepository } from "../../domain/repositories/PrismaEventRepository";
import { PrismaWhatsAppInstanceRepository } from "../../../../infra/whatsapp/PrismaWhatsAppInstanceRepository";
import { RefreshToken } from "../../../refreshToken/domain/entities/RefreshToken";
import { Event } from "../../domain/entities/Event";
import { EventAttendance } from "../../domain/entities/EventAttendance";

describe("ULID persistence contracts", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("RefreshToken.create() generates ULID", () => {
    const token = RefreshToken.create("user-id", "hash", new Date());
    expect(() => ulidSchema.parse(token.id)).not.toThrow();
  });

  it("PrismaEventAssignmentRepository.create() persists ULID", async () => {
    const repo = new PrismaEventAssignmentRepository(prisma as any);
    const eventId = generateId();
    const memberId = generateId();
    const ministryId = generateId();

    await prisma.member.create({
      data: { id: memberId, fullName: "T", normalizedFullName: "t", birthDate: new Date(), churchJoinDate: new Date() },
    });
    await prisma.event.create({
      data: { id: eventId, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date(), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
    });
    await prisma.ministry.create({
      data: { id: ministryId, name: `ULID-M-${generateId()}`, createdAt: new Date(), updatedAt: new Date() },
    });

    const record = await repo.create({ eventId, memberId, ministryId });
    expect(() => ulidSchema.parse(record.id)).not.toThrow();
  });

  it("PrismaEventRepository.assignAssignment() persists ULID", async () => {
    const repo = new PrismaEventRepository(prisma);
    const eventId = generateId();
    const memberId = generateId();
    const ministryId = generateId();

    await prisma.member.create({
      data: { id: memberId, fullName: "T2", normalizedFullName: "t2", birthDate: new Date(), churchJoinDate: new Date() },
    });
    await prisma.event.create({
      data: { id: eventId, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date(), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
    });
    await prisma.ministry.create({
      data: { id: ministryId, name: `ULID-M2-${generateId()}`, createdAt: new Date(), updatedAt: new Date() },
    });

    await repo.assignAssignment(eventId, memberId, ministryId);

    const assignment = await prisma.eventAssignment.findFirst({
      where: { eventId, memberId, ministryId },
    });
    expect(assignment).not.toBeNull();
    expect(() => ulidSchema.parse(assignment!.id)).not.toThrow();
  });

  it("PrismaWhatsAppInstanceRepository.create() persists ULID", async () => {
    const repo = new PrismaWhatsAppInstanceRepository(prisma);

    const instance = await repo.create({
      instanceName: `ulid-test-${generateId()}`,
      userId: null as any,
      isActive: false,
    });
    expect(() => ulidSchema.parse(instance.id)).not.toThrow();

    await prisma.whatsAppInstance.delete({ where: { id: instance.id } });
  });

  it("EventAttendance upsert create branch persists ULID", async () => {
    const eventId = generateId();
    await prisma.event.create({
      data: { id: eventId, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date(), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
    });

    const attendance = EventAttendance.create({ eventId, membersCount: 10, visitorsCount: 2 });
    await prisma.eventAttendance.upsert({
      where: { eventId },
      update: { membersCount: 10, visitorsCount: 2, updatedAt: new Date() },
      create: { id: attendance.id, eventId, membersCount: 10, visitorsCount: 2 },
    });

    const saved = await prisma.eventAttendance.findUnique({ where: { eventId } });
    expect(saved).not.toBeNull();
    expect(() => ulidSchema.parse(saved!.id)).not.toThrow();
  });

  it("EventAttendance upsert update preserves existing ULID", async () => {
    const eventId = generateId();
    await prisma.event.create({
      data: { id: eventId, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date(), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
    });

    const attendance = EventAttendance.create({ eventId, membersCount: 5, visitorsCount: 1 });
    await prisma.eventAttendance.upsert({
      where: { eventId },
      update: { membersCount: 5, visitorsCount: 1, updatedAt: new Date() },
      create: { id: attendance.id, eventId, membersCount: 5, visitorsCount: 1 },
    });

    const original = await prisma.eventAttendance.findUnique({ where: { eventId } });
    const originalId = original!.id;

    await prisma.eventAttendance.upsert({
      where: { eventId },
      update: { membersCount: 99, updatedAt: new Date() },
      create: { id: generateId(), eventId, membersCount: 99, visitorsCount: 0 },
    });

    const afterUpdate = await prisma.eventAttendance.findUnique({ where: { eventId } });
    expect(afterUpdate!.id).toBe(originalId);
    expect(() => ulidSchema.parse(afterUpdate!.id)).not.toThrow();
  });
});
