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

describe("0H.2B — Event assignment", () => {
  let prisma: PrismaClient;
  let leaderToken: string;
  let otherLeaderToken: string;
  let treasurerToken: string;
  let memberToken: string;

  const leaderId = "u-as-leader";
  const otherLeaderId = "u-as-other-leader";
  const treasurerId = "u-as-treasurer";
  const memberUserId = "u-as-member";
  const memberId = generateId();
  const otherMemberId = generateId();
  const leaderMemberId = generateId();
  const otherLeaderMemberId = generateId();
  const ministryId = generateId();
  const otherMinistryId = generateId();
  const eventId = generateId();
  const finishedEventId = generateId();
  const cancelledEventId = generateId();
  const deletedEventId = generateId();

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-as-leader", name: "MINISTRY_LEADER", level: 40 },
        { id: "r-as-treasurer", name: "TREASURER", level: 80 },
        { id: "r-as-member", name: "MEMBER", level: 10 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: leaderId, email: "as-leader@test.com", passwordHash: "h", isActive: true },
        { id: otherLeaderId, email: "as-other-leader@test.com", passwordHash: "h", isActive: true },
        { id: treasurerId, email: "as-treasurer@test.com", passwordHash: "h", isActive: true },
        { id: memberUserId, email: "as-member@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: leaderId, roleId: "r-as-leader" },
        { userId: otherLeaderId, roleId: "r-as-leader" },
        { userId: treasurerId, roleId: "r-as-treasurer" },
        { userId: memberUserId, roleId: "r-as-member" },
      ],
    });

    const now = new Date();
    await prisma.member.createMany({
      data: [
        { id: memberId, fullName: "Member One", normalizedFullName: "member one", birthDate: now, churchJoinDate: now, userId: memberUserId },
        { id: otherMemberId, fullName: "Other Member", normalizedFullName: "other member", birthDate: now, churchJoinDate: now },
        { id: leaderMemberId, fullName: "Leader Person", normalizedFullName: "leader person", birthDate: now, churchJoinDate: now, userId: leaderId },
        { id: otherLeaderMemberId, fullName: "Other Leader Person", normalizedFullName: "other leader person", birthDate: now, churchJoinDate: now, userId: otherLeaderId },
      ],
    });

    await prisma.ministry.createMany({
      data: [
        { id: ministryId, name: "Music", leaderId: leaderMemberId },
        { id: otherMinistryId, name: "Kids", leaderId: otherLeaderMemberId },
      ],
    });

    await prisma.event.createMany({
      data: [
        { id: eventId, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date("2026-08-02T08:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
        { id: finishedEventId, type: "SUNDAY_SERVICE", status: "FINISHED", startsAt: new Date("2026-07-26T08:00:00Z"), endsAt: new Date("2026-07-26T10:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
        { id: cancelledEventId, type: "SUNDAY_SERVICE", status: "CANCELLED", startsAt: new Date("2026-07-26T08:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date(), cancelledAt: new Date(), cancelledById: treasurerId, cancelReason: "Test cancel" },
        { id: deletedEventId, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date("2026-07-26T08:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date(), deletedAt: new Date(), deletedById: treasurerId, deleteReason: "Test delete" },
      ],
    });

    leaderToken = authCookie(leaderId, 40);
    otherLeaderToken = authCookie(otherLeaderId, 40);
    treasurerToken = authCookie(treasurerId, 80);
    memberToken = authCookie(memberUserId, 10);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Assignment with ministry — SCHEDULED event", () => {
    it("leader creates assignment → 200", async () => {
      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, ministryId });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(memberId);

      const assignment = await prisma.eventAssignment.findFirst({
        where: { eventId, memberId, ministryId },
      });
      expect(assignment).not.toBeNull();
    });

    it("TREASURER creates assignment → 200", async () => {
      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId, ministryId } });

      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", treasurerToken)
        .send({ memberId, ministryId });

      expect(res.status).toBe(200);
    });

    it("leader from another ministry → 403", async () => {
      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId, ministryId } });

      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", otherLeaderToken)
        .send({ memberId, ministryId });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("NOT_MINISTRY_LEADER");
    });

    it("MEMBER level → 403", async () => {
      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId, ministryId } });

      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", memberToken)
        .send({ memberId, ministryId });

      expect(res.status).toBe(403);
    });

    it("non-existent member → 404", async () => {
      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId: "NONEXISTENT", ministryId });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("MEMBER_NOT_FOUND");
    });

    it("non-existent ministry → 404", async () => {
      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, ministryId: "NONEXISTENT" });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("MINISTRY_NOT_FOUND");
    });

    it("non-existent event → 404", async () => {
      const res = await request(app)
        .patch(`/events/NONEXISTENT/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, ministryId });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("EVENT_NOT_FOUND");
    });
  });

  describe("Assignment blocked by event state", () => {
    it("deleted event → 409", async () => {
      const res = await request(app)
        .patch(`/events/${deletedEventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, ministryId });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EVENT_DELETED");
    });

    it("cancelled event → 409", async () => {
      const res = await request(app)
        .patch(`/events/${cancelledEventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, ministryId });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EVENT_ALREADY_CANCELLED");
    });

    it("finished event → 409", async () => {
      const res = await request(app)
        .patch(`/events/${finishedEventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, ministryId });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EVENT_FINISHED");
    });
  });

  describe("Sequential duplicate", () => {
    it("creates assignment first time", async () => {
      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId, ministryId } });

      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, ministryId });

      expect(res.status).toBe(200);
    });

    it("second call returns alreadyAssigned", async () => {
      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, ministryId });

      expect(res.status).toBe(200);
      expect(res.body.alreadyAssigned).toBe(true);

      const count = await prisma.eventAssignment.count({ where: { eventId, memberId, ministryId } });
      expect(count).toBe(1);
    });
  });

  describe("Notification", () => {
    it("assignment with member with userId creates notification", async () => {
      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId, ministryId } });
      const notifCount = await prisma.notification.count();

      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, ministryId });

      expect(res.status).toBe(200);

      const newCount = await prisma.notification.count();
      expect(newCount).toBe(notifCount + 1);
    });

    it("duplicate does not create second notification", async () => {
      const notifCount = await prisma.notification.count();

      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, ministryId });

      expect(res.status).toBe(200);
      expect(res.body.alreadyAssigned).toBe(true);

      const newCount = await prisma.notification.count();
      expect(newCount).toBe(notifCount);
    });

    it("assignment to member without userId skips notification", async () => {
      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId: otherMemberId, ministryId } });
      const notifCount = await prisma.notification.count();

      const res = await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId: otherMemberId, ministryId });

      expect(res.status).toBe(200);

      const newCount = await prisma.notification.count();
      expect(newCount).toBe(notifCount);
    });
  });

  describe("Removal — assignmentId present", () => {
    let assignmentId: string | undefined;

    beforeAll(async () => {
      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId, ministryId } });
      await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, ministryId });
      const a = await prisma.eventAssignment.findFirst({ where: { eventId, memberId, ministryId } });
      assignmentId = a?.id;
    });

    it("leader removes assignment → 200", async () => {
      const res = await request(app)
        .patch(`/events/${eventId}/removeMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, assignmentId });

      expect(res.status).toBe(200);

      const remaining = await prisma.eventAssignment.findFirst({ where: { id: assignmentId } });
      expect(remaining).toBeNull();
    });

    it("removal creates notification", async () => {
      const notif = await prisma.notification.findFirst({
        where: { type: "MEMBRO_REMOVIDO" },
        orderBy: { createdAt: "desc" },
      });
      expect(notif).not.toBeNull();
    });
  });

  describe("Removal — unauthorized", () => {
    it("leader from other ministry cannot remove", async () => {
      await prisma.eventAssignment.deleteMany({ where: { eventId, memberId, ministryId } });
      await request(app)
        .patch(`/events/${eventId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId, ministryId });
      const a = await prisma.eventAssignment.findFirst({ where: { eventId, memberId, ministryId } });

      const res = await request(app)
        .patch(`/events/${eventId}/removeMember`)
        .set("Cookie", otherLeaderToken)
        .send({ memberId, assignmentId: a!.id });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("NOT_MINISTRY_LEADER");
    });
  });
});
