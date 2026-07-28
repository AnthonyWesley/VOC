import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../../../../app";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase } from "../../../../__tests__/helpers";
import { generateId } from "../../../../shared/utils/generateId";

const jwt = new JwtProvider();

function authCookie(userId: string, level: number) {
  return `accessToken=${jwt.signAccessToken({ userId, userLevel: level, sessionId: "s" })}`;
}

describe("0H.2B — Event attendance (no ministry)", () => {
  let prisma: PrismaClient;
  let leaderToken: string;
  let memberToken: string;

  const leaderId = "u-at-leader";
  const memberUserId = "u-at-member";
  const memberId = generateId();
  const leaderMemberId = generateId();
  const eventId = generateId();
  const finishedEventId = generateId();
  const cancelledEventId = generateId();
  const deletedEventId = generateId();
  const cancelledRmMemberId = generateId();
  const deletedRmMemberId = generateId();

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-at-leader", name: "MINISTRY_LEADER", level: 40 },
        { id: "r-at-member", name: "MEMBER", level: 10 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: leaderId, email: "at-leader@test.com", passwordHash: "h", isActive: true },
        { id: memberUserId, email: "at-member@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: leaderId, roleId: "r-at-leader" },
        { userId: memberUserId, roleId: "r-at-member" },
      ],
    });

    const now = new Date();
    await prisma.member.createMany({
      data: [
        { id: memberId, fullName: "Attendance Member", normalizedFullName: "attendance member", birthDate: now, churchJoinDate: now, userId: memberUserId },
        { id: leaderMemberId, fullName: "Attendance Leader", normalizedFullName: "attendance leader", birthDate: now, churchJoinDate: now, userId: leaderId },
      ],
    });

    await prisma.event.createMany({
      data: [
        { id: eventId, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date("2026-08-02T08:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
        { id: finishedEventId, type: "SUNDAY_SERVICE", status: "FINISHED", startsAt: new Date("2026-07-26T08:00:00Z"), endsAt: new Date("2026-07-26T10:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
        { id: cancelledEventId, type: "SUNDAY_SERVICE", status: "CANCELLED", startsAt: new Date("2026-07-26T08:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date(), cancelledAt: new Date(), cancelledById: leaderId, cancelReason: "Test" },
        { id: deletedEventId, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date("2026-07-26T08:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date(), deletedAt: new Date(), deletedById: leaderId, deleteReason: "Test" },
      ],
    });

    await prisma.member.createMany({
      data: [
        { id: cancelledRmMemberId, fullName: "Cancelled Rm Member", normalizedFullName: "cancelled rm member", birthDate: now, churchJoinDate: now, userId: null },
        { id: deletedRmMemberId, fullName: "Deleted Rm Member", normalizedFullName: "deleted rm member", birthDate: now, churchJoinDate: now, userId: null },
      ],
    });

    await prisma.eventMember.createMany({
      data: [
        { eventId: cancelledEventId, memberId: cancelledRmMemberId },
        { eventId: deletedEventId, memberId: deletedRmMemberId },
      ],
    });

    leaderToken = authCookie(leaderId, 40);
    memberToken = authCookie(memberUserId, 10);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Register attendance (no ministryId)", () => {
    it("creates EventMember → 200", async () => {
      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId });

      expect(res.status).toBe(200);

      const em = await prisma.eventMember.findFirst({ where: { eventId, memberId } });
      expect(em).not.toBeNull();
    });

    it("participantType defaults to MEMBER", async () => {
      const em = await prisma.eventMember.findFirst({ where: { eventId, memberId } });
      expect(em?.participantType).toBe("MEMBER");
    });

    it("repeated registration returns alreadyPresent", async () => {
      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId });

      expect(res.status).toBe(200);
      expect(res.body.alreadyPresent).toBe(true);

      const count = await prisma.eventMember.count({ where: { eventId, memberId } });
      expect(count).toBe(1);
    });
  });

  describe("Attendance blocked by event state", () => {
    it("deleted event → 409", async () => {
      const res = await request(app)
        .patch(`/events/${deletedEventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EVENT_DELETED");
    });

    it("cancelled event → 409", async () => {
      const res = await request(app)
        .patch(`/events/${cancelledEventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EVENT_ALREADY_CANCELLED");
    });

    it("finished event → 409", async () => {
      const res = await request(app)
        .patch(`/events/${finishedEventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EVENT_FINISHED");
    });
  });

  describe("Removal — no assignmentId", () => {
    it("removes EventMember", async () => {
      const res = await request(app)
        .patch(`/events/${eventId}/removeMember`)
        .set("Cookie", leaderToken)
        .send({ memberId });

      expect(res.status).toBe(200);

      const em = await prisma.eventMember.findFirst({ where: { eventId, memberId } });
      expect(em).toBeNull();
    });

    it("member not present still returns 200 (idempotent)", async () => {
      const res = await request(app)
        .patch(`/events/${eventId}/removeMember`)
        .set("Cookie", leaderToken)
        .send({ memberId });

      expect(res.status).toBe(200);
    });

    it("removal blocked on finished event", async () => {
      const res = await request(app)
        .patch(`/events/${finishedEventId}/removeMember`)
        .set("Cookie", leaderToken)
        .send({ memberId });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EVENT_FINISHED");
    });

    it("removal blocked on cancelled event", async () => {
      const res = await request(app)
        .patch(`/events/${cancelledEventId}/removeMember`)
        .set("Cookie", leaderToken)
        .send({ memberId: cancelledRmMemberId });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EVENT_ALREADY_CANCELLED");

      const em = await prisma.eventMember.findFirst({ where: { eventId: cancelledEventId, memberId: cancelledRmMemberId } });
      expect(em).not.toBeNull();
    });

    it("removal blocked on deleted event", async () => {
      const res = await request(app)
        .patch(`/events/${deletedEventId}/removeMember`)
        .set("Cookie", leaderToken)
        .send({ memberId: deletedRmMemberId });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EVENT_DELETED");

      const em = await prisma.eventMember.findFirst({ where: { eventId: deletedEventId, memberId: deletedRmMemberId } });
      expect(em).not.toBeNull();
    });

    it("removal of non-existent member on active event returns 200", async () => {
      const res = await request(app)
        .patch(`/events/${eventId}/removeMember`)
        .set("Cookie", leaderToken)
        .send({ memberId: generateId() });

      expect(res.status).toBe(200);
    });
  });
});
