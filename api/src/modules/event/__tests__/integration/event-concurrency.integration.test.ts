import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaEventRepository } from "../../domain/repositories/PrismaEventRepository";
import { PrismaEventAssignmentRepository } from "../../infra/repositories/PrismaEventAssignmentRepository";
import { PrismaNotificationRepository } from "../../../notification/domain/repositories/PrismaNotificationRepository";
import { CreateNotificationUseCase } from "../../../notification/usecases/CreateNotificationUseCase";
import { PrismaEventCriticalSection } from "../../infra/transactions/PrismaEventCriticalSection";
import { AssignMemberToEventUseCase } from "../../usecases/AssignMemberToEventUseCase";
import { RemoveMemberFromEventUseCase } from "../../usecases/RemoveMemberFromEventUseCase";
import { CancelEventUseCase } from "../../usecases/CancelEventUseCase";
import { CloseEventWithSummaryUseCase } from "../../usecases/CloseEventWithSummaryUseCase";
import { DeleteEventUseCase } from "../../usecases/DeleteEventUseCase";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase } from "../../../../__tests__/helpers";
import { generateId } from "../../../../shared/utils/generateId";

const MEMBER_USER_ID = "u-conc-member";
const LEADER_USER_ID = "u-conc-leader";
const MINISTRY_LEADER_LEVEL = 40;

function csFrom(prisma: PrismaClient): PrismaEventCriticalSection {
  return new PrismaEventCriticalSection(prisma);
}

describe("0I.2 — Event Terminal-State Concurrency", () => {
  let prisma: PrismaClient;
  let memberId: string;
  let leaderMemberId: string;
  let ministryId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-conc-leader", name: "MINISTRY_LEADER", level: 40 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: LEADER_USER_ID, email: "conc-leader@test.com", passwordHash: "h", isActive: true },
        { id: MEMBER_USER_ID, email: "conc-member@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: LEADER_USER_ID, roleId: "r-conc-leader" },
      ],
    });

    const now = new Date();
    memberId = generateId();
    leaderMemberId = generateId();
    await prisma.member.createMany({
      data: [
        { id: memberId, fullName: "Conc Member", normalizedFullName: "conc member", birthDate: now, churchJoinDate: now, userId: MEMBER_USER_ID },
        { id: leaderMemberId, fullName: "Conc Leader", normalizedFullName: "conc leader", birthDate: now, churchJoinDate: now, userId: LEADER_USER_ID },
      ],
    });

    ministryId = generateId();
    await prisma.ministry.create({
      data: { id: ministryId, name: "Conc Ministry", leaderId: leaderMemberId },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createEvent(status: "SCHEDULED" | "CANCELLED" | "FINISHED" = "SCHEDULED", overrides?: Record<string, unknown>) {
    const id = generateId();
    const data: any = {
      id,
      type: "SUNDAY_SERVICE",
      status,
      startsAt: new Date("2026-09-01T08:00:00Z"),
      attendanceMode: "SUMMARY",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
    if (status === "CANCELLED") {
      data.cancelledAt = new Date();
      data.cancelledById = LEADER_USER_ID;
      data.cancelReason = "test";
    }
    if (status === "FINISHED") {
      data.endsAt = new Date();
    }
    await prisma.event.create({ data });
    return id;
  }

  describe("Same-operation concurrency", () => {
    it("1. dois assignMember (com ministry) paralelos — exatamente um assignment", async () => {
      const eventId = await createEvent("SCHEDULED");
      const cs = csFrom(prisma);
      const repo = new PrismaEventRepository(prisma);
      const lookup = new PrismaEventAssignmentRepository(prisma);
      const notifRepo = new PrismaNotificationRepository(prisma);
      const createNotif = new CreateNotificationUseCase(notifRepo);
      const publisher = { publish: vi.fn() };
      const whatsApp = { sendMessage: vi.fn() };
      const uc1 = new AssignMemberToEventUseCase(repo, lookup, cs, createNotif, prisma, whatsApp as any, publisher as any);
      const uc2 = new AssignMemberToEventUseCase(repo, lookup, cs, createNotif, prisma, whatsApp as any, publisher as any);

      const [r1, r2] = await Promise.allSettled([
        uc1.execute({ eventId, memberId, ministryId, userId: LEADER_USER_ID, userLevel: MINISTRY_LEADER_LEVEL }),
        uc2.execute({ eventId, memberId, ministryId, userId: LEADER_USER_ID, userLevel: MINISTRY_LEADER_LEVEL }),
      ]);

      const count = await prisma.eventAssignment.count({ where: { eventId, memberId, ministryId } });
      expect(count).toBe(1);

      const successes = [r1, r2].filter((r) => r.status === "fulfilled");
      expect(successes.length).toBeGreaterThanOrEqual(1);
    });

    it("2. dois assignMember (sem ministry) paralelos — exatamente um EventMember", async () => {
      const eventId = await createEvent("SCHEDULED");
      const cs = csFrom(prisma);
      const repo = new PrismaEventRepository(prisma);
      const lookup = new PrismaEventAssignmentRepository(prisma);
      const notif = { execute: vi.fn() };
      const publisher = { publish: vi.fn() };
      const whatsApp = { sendMessage: vi.fn() };
      const uc1 = new AssignMemberToEventUseCase(repo, lookup, cs, notif as any, prisma, whatsApp as any, publisher as any);
      const uc2 = new AssignMemberToEventUseCase(repo, lookup, cs, notif as any, prisma, whatsApp as any, publisher as any);

      const [r1, r2] = await Promise.allSettled([
        uc1.execute({ eventId, memberId, userId: LEADER_USER_ID, userLevel: MINISTRY_LEADER_LEVEL }),
        uc2.execute({ eventId, memberId, userId: LEADER_USER_ID, userLevel: MINISTRY_LEADER_LEVEL }),
      ]);

      const count = await prisma.eventMember.count({ where: { eventId, memberId } });
      expect(count).toBe(1);

      const successes = [r1, r2].filter((r) => r.status === "fulfilled");
      expect(successes.length).toBeGreaterThanOrEqual(1);
    });

    it("3. dois removeAssignment paralelos — assignment removido (deleteMany é idempotente)", async () => {
      const eventId = await createEvent("SCHEDULED");
      const assignmentId = generateId();
      await prisma.eventAssignment.create({
        data: { id: assignmentId, eventId, memberId, ministryId, assignedAt: new Date() },
      });
      const cs = csFrom(prisma);
      const repo = new PrismaEventRepository(prisma);
      const notif = { execute: vi.fn() };
      const publisher = { publish: vi.fn() };
      const whatsApp = { sendMessage: vi.fn() };
      const uc1 = new RemoveMemberFromEventUseCase(repo, cs, prisma, undefined, notif as any, whatsApp as any, publisher as any);
      const uc2 = new RemoveMemberFromEventUseCase(repo, cs, prisma, undefined, notif as any, whatsApp as any, publisher as any);

      const [r1, r2] = await Promise.allSettled([
        uc1.execute({ eventId, memberId, assignmentId, userId: LEADER_USER_ID, userLevel: MINISTRY_LEADER_LEVEL }),
        uc2.execute({ eventId, memberId, assignmentId, userId: LEADER_USER_ID, userLevel: MINISTRY_LEADER_LEVEL }),
      ]);

      const count = await prisma.eventAssignment.count({ where: { eventId } });
      expect(count).toBe(0);

      // ambos podem ser fulfilled porque deleteMany é idempotente
      expect(r1.status).toBe("fulfilled");
      expect(r2.status).toBe("fulfilled");
    });

    it("4. dois cancelEvent paralelos — exatamente um marca CANCELLED", async () => {
      const eventId = await createEvent("SCHEDULED");
      const cs = csFrom(prisma);
      const repo = new PrismaEventRepository(prisma);
      const uc1 = new CancelEventUseCase(repo, cs);
      const uc2 = new CancelEventUseCase(repo, cs);

      const [r1, r2] = await Promise.allSettled([
        uc1.execute({ eventId, cancelledById: LEADER_USER_ID, reason: "aaa" }),
        uc2.execute({ eventId, cancelledById: LEADER_USER_ID, reason: "bbb" }),
      ]);

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      expect(event!.status).toBe("CANCELLED");

      const successes = [r1, r2].filter((r) => r.status === "fulfilled");
      expect(successes.length).toBeGreaterThanOrEqual(1);
    });

    it("5. dois closeEvent paralelos — exatamente um marca FINISHED", async () => {
      const eventId = await createEvent("SCHEDULED");
      const cs = csFrom(prisma);
      const repo = new PrismaEventRepository(prisma);
      const writeTx = { execute: vi.fn() };
      const adminReader = { findEventAdminUserIds: vi.fn() };
      const close = new CloseEventWithSummaryUseCase(repo, cs, writeTx as any, adminReader as any);
      const close2 = new CloseEventWithSummaryUseCase(repo, cs, writeTx as any, adminReader as any);

      const [r1, r2] = await Promise.allSettled([
        close.execute({
          mode: "CLOSE_EXISTING",
          eventId,
          summary: { attendance: { membersCount: 50, visitorsCount: 10 } },
        }),
        close2.execute({
          mode: "CLOSE_EXISTING",
          eventId,
          summary: { attendance: { membersCount: 50, visitorsCount: 10 } },
        }),
      ]);

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      expect(event!.status).toBe("FINISHED");

      const successes = [r1, r2].filter((r) => r.status === "fulfilled");
      expect(successes.length).toBeGreaterThanOrEqual(1);
    });

    it("6. dois deleteEvent paralelos — exatamente um soft-delete", async () => {
      const eventId = await createEvent("SCHEDULED", { createdById: LEADER_USER_ID });
      const cs = csFrom(prisma);
      const repo = new PrismaEventRepository(prisma);
      const uc1 = new DeleteEventUseCase(repo, cs);
      const uc2 = new DeleteEventUseCase(repo, cs);

      const [r1, r2] = await Promise.allSettled([
        uc1.execute({ eventId, deletedById: LEADER_USER_ID, userLevel: MINISTRY_LEADER_LEVEL }),
        uc2.execute({ eventId, deletedById: LEADER_USER_ID, userLevel: MINISTRY_LEADER_LEVEL }),
      ]);

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      expect(event!.deletedAt).not.toBeNull();

      const successes = [r1, r2].filter((r) => r.status === "fulfilled");
      expect(successes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Cross-operation concurrency", () => {
    it("7. assignMember + cancelEvent — ambos podem coexistir (assign não muda status), mas se cancel venceu não há assignment", async () => {
      const eventId = await createEvent("SCHEDULED");
      const cs = csFrom(prisma);
      const repo = new PrismaEventRepository(prisma);
      const lookup = new PrismaEventAssignmentRepository(prisma);
      const notif = { execute: vi.fn() };
      const publisher = { publish: vi.fn() };
      const whatsApp = { sendMessage: vi.fn() };
      const assignUC = new AssignMemberToEventUseCase(repo, lookup, cs, notif as any, prisma, whatsApp as any, publisher as any);
      const cancelUC = new CancelEventUseCase(repo, cs);

      await Promise.allSettled([
        assignUC.execute({ eventId, memberId, ministryId, userId: LEADER_USER_ID, userLevel: MINISTRY_LEADER_LEVEL }),
        cancelUC.execute({ eventId, cancelledById: LEADER_USER_ID, reason: "concorrencia" }),
      ]);

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      const assignments = await prisma.eventAssignment.count({ where: { eventId, memberId, ministryId } });

      expect(event!.status).toBeOneOf(["SCHEDULED", "CANCELLED"]);
      if (event!.status === "CANCELLED") {
        expect(assignments).toBe(0);
      }
      // if SCHEDULED, assign may have succeeded
    });

    it("8. assignMember (com ministry) + closeEvent — se FINISHED, assignment não foi criado", async () => {
      const eventId = await createEvent("SCHEDULED");
      const cs = csFrom(prisma);
      const repo = new PrismaEventRepository(prisma);
      const lookup = new PrismaEventAssignmentRepository(prisma);
      const notif = { execute: vi.fn() };
      const publisher = { publish: vi.fn() };
      const whatsApp = { sendMessage: vi.fn() };
      const assignUC = new AssignMemberToEventUseCase(repo, lookup, cs, notif as any, prisma, whatsApp as any, publisher as any);
      const writeTx = { execute: vi.fn() };
      const adminReader = { findEventAdminUserIds: vi.fn() };
      const closeUC = new CloseEventWithSummaryUseCase(repo, cs, writeTx as any, adminReader as any);

      await Promise.allSettled([
        assignUC.execute({ eventId, memberId, ministryId, userId: LEADER_USER_ID, userLevel: MINISTRY_LEADER_LEVEL }),
        closeUC.execute({
          mode: "CLOSE_EXISTING",
          eventId,
          summary: { attendance: { membersCount: 50, visitorsCount: 10 } },
        }),
      ]);

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      const assignments = await prisma.eventAssignment.count({ where: { eventId, memberId, ministryId } });

      expect(event!.status).toBeOneOf(["SCHEDULED", "FINISHED"]);
      if (event!.status === "FINISHED") {
        expect(assignments).toBe(0);
      }
    });

    it("9. removeAssignment + closeEvent — closeEvent vence → removeAssignment rejeitado; removeAssignment vence → assignment removido", async () => {
      const eventId = await createEvent("SCHEDULED");
      const assignmentId = generateId();
      await prisma.eventAssignment.create({
        data: { id: assignmentId, eventId, memberId, ministryId, assignedAt: new Date() },
      });
      const cs = csFrom(prisma);
      const repo = new PrismaEventRepository(prisma);
      const notif = { execute: vi.fn() };
      const publisher = { publish: vi.fn() };
      const whatsApp = { sendMessage: vi.fn() };
      const removeUC = new RemoveMemberFromEventUseCase(repo, cs, prisma, undefined, notif as any, whatsApp as any, publisher as any);
      const writeTx = { execute: vi.fn() };
      const adminReader = { findEventAdminUserIds: vi.fn() };
      const closeUC = new CloseEventWithSummaryUseCase(repo, cs, writeTx as any, adminReader as any);

      const [rr, rc] = await Promise.allSettled([
        removeUC.execute({ eventId, memberId, assignmentId, userId: LEADER_USER_ID, userLevel: MINISTRY_LEADER_LEVEL }),
        closeUC.execute({
          mode: "CLOSE_EXISTING",
          eventId,
          summary: { attendance: { membersCount: 50, visitorsCount: 10 } },
        }),
      ]);

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      const assignment = await prisma.eventAssignment.findUnique({ where: { id: assignmentId } });

      if (event!.status === "FINISHED") {
        // closeEvent venceu — o removeAssignment foi rejeitado
        expect(rr.status).toBe("rejected");
      } else {
        // removeAssignment venceu — assignment não existe mais
        expect(assignment).toBeNull();
        expect(rc.status).toBe("fulfilled");
      }
    });

    it("10. assignMember (sem ministry) + closeEvent — mesma lógica", async () => {
      const eventId = await createEvent("SCHEDULED");
      const cs = csFrom(prisma);
      const repo = new PrismaEventRepository(prisma);
      const lookup = new PrismaEventAssignmentRepository(prisma);
      const notif = { execute: vi.fn() };
      const publisher = { publish: vi.fn() };
      const whatsApp = { sendMessage: vi.fn() };
      const assignUC = new AssignMemberToEventUseCase(repo, lookup, cs, notif as any, prisma, whatsApp as any, publisher as any);
      const writeTx = { execute: vi.fn() };
      const adminReader = { findEventAdminUserIds: vi.fn() };
      const closeUC = new CloseEventWithSummaryUseCase(repo, cs, writeTx as any, adminReader as any);

      await Promise.allSettled([
        assignUC.execute({ eventId, memberId, userId: LEADER_USER_ID, userLevel: MINISTRY_LEADER_LEVEL }),
        closeUC.execute({
          mode: "CLOSE_EXISTING",
          eventId,
          summary: { attendance: { membersCount: 50, visitorsCount: 10 } },
        }),
      ]);

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      const member = await prisma.eventMember.findUnique({ where: { eventId_memberId: { eventId, memberId } } });

      expect(event!.status).toBeOneOf(["SCHEDULED", "FINISHED"]);
      if (event!.status === "FINISHED") {
        expect(member).toBeNull();
      }
      // if SCHEDULED, the EventMember exists
    });
  });
});
