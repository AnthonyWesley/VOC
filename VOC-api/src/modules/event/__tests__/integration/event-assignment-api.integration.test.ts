import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../../../../app";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { AssignMemberToEventUseCase } from "../../usecases/AssignMemberToEventUseCase";
import { PrismaEventRepository } from "../../domain/repositories/PrismaEventRepository";
import { PrismaEventAssignmentRepository } from "../../infra/repositories/PrismaEventAssignmentRepository";
import { PrismaEventCriticalSection } from "../../infra/transactions/PrismaEventCriticalSection";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase } from "../../../../__tests__/helpers";
import { generateId } from "../../../../shared/utils/generateId";

const jwt = new JwtProvider();

function authCookie(userId: string, level: number) {
  return `accessToken=${jwt.signAccessToken({ userId, userLevel: level, sessionId: "s" })}`;
}

describe("0H.2B — Assignment API concurrency & atomicity", () => {
  let prisma: PrismaClient;
  let leaderToken: string;

  const leaderId = "u-api-leader";
  const memberUserId = "u-api-member";
  const memberId = generateId();
  const leaderMemberId = generateId();
  const ministryId = generateId();
  const eventId = generateId();

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-api-leader", name: "MINISTRY_LEADER", level: 40 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: leaderId, email: "api-leader@test.com", passwordHash: "h", isActive: true },
        { id: memberUserId, email: "api-member@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: leaderId, roleId: "r-api-leader" },
      ],
    });

    const now = new Date();
    await prisma.member.createMany({
      data: [
        { id: memberId, fullName: "API Member", normalizedFullName: "api member", birthDate: now, churchJoinDate: now, userId: memberUserId },
        { id: leaderMemberId, fullName: "API Leader", normalizedFullName: "api leader", birthDate: now, churchJoinDate: now, userId: leaderId },
      ],
    });

    await prisma.ministry.create({
      data: { id: ministryId, name: "API Ministry", leaderId: leaderMemberId },
    });

    await prisma.event.create({
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

    leaderToken = authCookie(leaderId, 40);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Concurrent HTTP requests", () => {
    it("two parallel assignMember calls with ministry → final invariants hold", async () => {
      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId, ministryId } });
      await prisma.notification.deleteMany({ where: { userId: memberUserId } });

      const [first, second] = await Promise.all([
        request(app)
          .patch(`/events/${eventId}/assignMember`)
          .set("Cookie", leaderToken)
          .send({ memberId, ministryId }),
        request(app)
          .patch(`/events/${eventId}/assignMember`)
          .set("Cookie", leaderToken)
          .send({ memberId, ministryId }),
      ]);

      expect(first.status).not.toBe(500);
      expect(second.status).not.toBe(500);

      const assignmentCount = await prisma.eventAssignment.count({
        where: { eventId, memberId, ministryId },
      });
      expect(assignmentCount).toBe(1);

      const notificationCount = await prisma.notification.count({
        where: { type: "MEMBRO_ESCALADO" },
      });
      expect(notificationCount).toBe(1);
    });
  });

  describe("Atomicity: assignment + notification in same transaction", () => {
    it("failing notification → no EventAssignment, no Notification, no realtime, no WhatsApp", async () => {
      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId, ministryId } });
      await prisma.notification.deleteMany({ where: { userId: memberUserId } });
      const eventRepo = new PrismaEventRepository(prisma);
      const assignmentLookup = new PrismaEventAssignmentRepository(prisma);
      const criticalSection = new PrismaEventCriticalSection(prisma);

      // createNotification.execute will be called inside the transaction and fail
      const failingNotifier = { execute: vi.fn().mockRejectedValue(new Error("FORCED_NOTIFICATION_FAILURE")) };
      const fakePublisher = { publish: vi.fn() };
      const fakeWhatsApp = { sendMessage: vi.fn().mockResolvedValue({ ok: false, code: "NOT_CONFIGURED" }) };

      const useCase = new AssignMemberToEventUseCase(
        eventRepo,
        assignmentLookup,
        criticalSection,
        failingNotifier as any,
        prisma,
        fakeWhatsApp as any,
        fakePublisher as any,
      );

      await expect(
        useCase.execute({
          eventId,
          memberId,
          ministryId,
          userId: leaderId,
          userLevel: 40,
        }),
      ).rejects.toThrow("FORCED_NOTIFICATION_FAILURE");

      expect(
        await prisma.eventAssignment.count({ where: { eventId, memberId, ministryId } }),
      ).toBe(0);

      expect(
        await prisma.notification.count({ where: { userId: memberUserId } }),
      ).toBe(0);

      expect(fakePublisher.publish).not.toHaveBeenCalled();
      expect(fakeWhatsApp.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe("Publisher observes notification after commit", () => {
    it("realtime publisher sees the notification already persisted when called", async () => {
      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId, ministryId } });
      await prisma.notification.deleteMany({ where: { userId: memberUserId } });

      const eventRepo = new PrismaEventRepository(prisma);
      const assignmentLookup = new PrismaEventAssignmentRepository(prisma);
      const criticalSection = new PrismaEventCriticalSection(prisma);
      const createNotification = new (await import("../../../../modules/notification/usecases/CreateNotificationUseCase")).CreateNotificationUseCase(
        new (await import("../../../../modules/notification/domain/repositories/PrismaNotificationRepository")).PrismaNotificationRepository(prisma),
      );

      let publishCheck: Promise<number> | undefined;
      const publisher = {
        publish: vi.fn(() => {
          publishCheck = prisma.notification.count({
            where: { userId: memberUserId, type: "MEMBRO_ESCALADO" },
          });
        }),
      };
      const fakeWhatsApp = { sendMessage: vi.fn().mockResolvedValue({ ok: false, code: "NOT_CONFIGURED" }) };

      const useCase = new AssignMemberToEventUseCase(
        eventRepo,
        assignmentLookup,
        criticalSection,
        createNotification,
        prisma,
        fakeWhatsApp as any,
        publisher as any,
      );

      await useCase.execute({
        eventId,
        memberId,
        ministryId,
        userId: leaderId,
        userLevel: 40,
      });

      expect(publisher.publish).toHaveBeenCalledOnce();
      expect(await publishCheck).toBe(1);
    });
  });

  describe("Member without userId", () => {
    it("creates assignment but no notification, no realtime, no WhatsApp", async () => {
      const noUserMemberId = generateId();
      await prisma.member.create({
        data: {
          id: noUserMemberId,
          fullName: "No User Member",
          normalizedFullName: "no user member",
          birthDate: new Date(),
          churchJoinDate: new Date(),
        },
      });

      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId: noUserMemberId, ministryId } });
      await prisma.notification.deleteMany({ where: { userId: memberUserId } });

      const eventRepo = new PrismaEventRepository(prisma);
      const assignmentLookup = new PrismaEventAssignmentRepository(prisma);
      const criticalSection = new PrismaEventCriticalSection(prisma);
      const notifRepo = new (await import("../../../../modules/notification/domain/repositories/PrismaNotificationRepository")).PrismaNotificationRepository(prisma);
      const createNotification = new (await import("../../../../modules/notification/usecases/CreateNotificationUseCase")).CreateNotificationUseCase(notifRepo);
      const publisher = { publish: vi.fn() };
      const whatsApp = { sendMessage: vi.fn() };

      const useCase = new AssignMemberToEventUseCase(
        eventRepo,
        assignmentLookup,
        criticalSection,
        createNotification,
        prisma,
        whatsApp as any,
        publisher as any,
      );

      const result = await useCase.execute({
        eventId,
        memberId: noUserMemberId,
        ministryId,
        userId: leaderId,
        userLevel: 40,
      });

      expect(result.id).toBe(noUserMemberId);

      const assignmentCount = await prisma.eventAssignment.count({
        where: { eventId, memberId: noUserMemberId, ministryId },
      });
      expect(assignmentCount).toBe(1);

      expect(publisher.publish).not.toHaveBeenCalled();
      expect(whatsApp.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe("Regression: assignMember without ministryId", () => {
    it("creates EventMember, not EventAssignment", async () => {
      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId } });
      await prisma.eventMember.deleteMany({ where: { eventId, memberId } });

      const eventRepo = new PrismaEventRepository(prisma);
      const assignmentLookup = new PrismaEventAssignmentRepository(prisma);
      const criticalSection = new PrismaEventCriticalSection(prisma);
      const notifRepo = new (await import("../../../../modules/notification/domain/repositories/PrismaNotificationRepository")).PrismaNotificationRepository(prisma);
      const createNotification = new (await import("../../../../modules/notification/usecases/CreateNotificationUseCase")).CreateNotificationUseCase(notifRepo);
      const publisher = { publish: vi.fn() };
      const whatsApp = { sendMessage: vi.fn() };

      const useCase = new AssignMemberToEventUseCase(
        eventRepo,
        assignmentLookup,
        criticalSection,
        createNotification,
        prisma,
        whatsApp as any,
        publisher as any,
      );

      const result = await useCase.execute({
        eventId,
        memberId,
        userId: leaderId,
        userLevel: 40,
      });

      expect(result.id).toBe(memberId);

      const eventMemberCount = await prisma.eventMember.count({
        where: { eventId, memberId },
      });
      expect(eventMemberCount).toBe(1);

      const eventAssignmentCount = await prisma.eventAssignment.count({
        where: { eventId, memberId },
      });
      expect(eventAssignmentCount).toBe(0);

      expect(publisher.publish).not.toHaveBeenCalled();
      expect(whatsApp.sendMessage).not.toHaveBeenCalled();
    });
  });
});
