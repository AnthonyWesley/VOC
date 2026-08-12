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

describe("0H.3B — Ministry member assignment", () => {
  let prisma: PrismaClient;
  const leaderUserId = "u-mem-leader";
  const otherLeaderUserId = "u-mem-other-leader";
  const presidentUserId = "u-mem-pres";
  const memberUserId = "u-mem-member";
  const leaderMemberId = generateId();
  const otherLeaderMemberId = generateId();
  const regularMemberId = generateId();
  const leaderToken = authCookie(leaderUserId, 40);
  const presidentToken = authCookie(presidentUserId, 100);
  const memberToken = authCookie(memberUserId, 10);
  const ministryId = generateId();
  const otherMinistryId = generateId();

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-mem-pres", name: "PRESIDENT", level: 100 },
        { id: "r-mem-leader", name: "MINISTRY_LEADER", level: 40 },
        { id: "r-mem-member", name: "MEMBER", level: 10 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: leaderUserId, email: "mem-leader@test.com", passwordHash: "h", isActive: true },
        { id: otherLeaderUserId, email: "mem-other-leader@test.com", passwordHash: "h", isActive: true },
        { id: presidentUserId, email: "mem-pres@test.com", passwordHash: "h", isActive: true },
        { id: memberUserId, email: "mem-member@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: leaderUserId, roleId: "r-mem-leader" },
        { userId: otherLeaderUserId, roleId: "r-mem-leader" },
        { userId: presidentUserId, roleId: "r-mem-pres" },
        { userId: memberUserId, roleId: "r-mem-member" },
      ],
    });

    await prisma.member.createMany({
      data: [
        { id: leaderMemberId, fullName: "Leader Member", normalizedFullName: "leader member", birthDate: new Date("1990-01-01"), churchJoinDate: new Date(), userId: leaderUserId },
        { id: otherLeaderMemberId, fullName: "Other Leader Member", normalizedFullName: "other leader member", birthDate: new Date("1991-01-01"), churchJoinDate: new Date(), userId: otherLeaderUserId },
        { id: regularMemberId, fullName: "Regular Member", normalizedFullName: "regular member", birthDate: new Date("1995-06-15"), churchJoinDate: new Date(), phone: "+5511999990001" },
      ],
    });

    await prisma.ministry.createMany({
      data: [
        { id: ministryId, name: "Music Ministry", leaderId: leaderMemberId },
        { id: otherMinistryId, name: "Kids Ministry", leaderId: otherLeaderMemberId },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("PATCH /ministries/:ministryId/assignMember", () => {
    it("leader assigns member to own ministry", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId: regularMemberId });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(regularMemberId);

      const link = await prisma.memberMinistry.findUnique({
        where: { memberId_ministryId: { memberId: regularMemberId, ministryId } },
      });
      expect(link).not.toBeNull();
    });

    it("leader cannot assign to another leader's ministry", async () => {
      const res = await request(app)
        .patch(`/ministries/${otherMinistryId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId: regularMemberId });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("NOT_MINISTRY_LEADER");
    });

    it("PRESIDENT can assign to any ministry", async () => {
      const newMemberId = generateId();
      await prisma.member.create({
        data: { id: newMemberId, fullName: "New Member", normalizedFullName: "new member", birthDate: new Date("2000-01-01"), churchJoinDate: new Date() },
      });

      const res = await request(app)
        .patch(`/ministries/${otherMinistryId}/assignMember`)
        .set("Cookie", presidentToken)
        .send({ memberId: newMemberId });

      expect(res.status).toBe(200);
    });

    it("returns 404 for non-existent ministry", async () => {
      const res = await request(app)
        .patch(`/ministries/${generateId()}/assignMember`)
        .set("Cookie", presidentToken)
        .send({ memberId: regularMemberId });

      expect(res.status).toBe(404);
    });

    it("returns 404 for non-existent member", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}/assignMember`)
        .set("Cookie", presidentToken)
        .send({ memberId: generateId() });

      expect(res.status).toBe(404);
    });

    it("returns 403 for MEMBER level", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}/assignMember`)
        .set("Cookie", memberToken)
        .send({ memberId: regularMemberId });

      expect(res.status).toBe(403);
    });

    it("returns 401 without auth", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}/assignMember`)
        .send({ memberId: regularMemberId });

      expect(res.status).toBe(401);
    });

    it("returns alreadyAssigned for duplicate assignment", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId: regularMemberId });

      expect(res.status).toBe(200);
      expect(res.body.alreadyAssigned).toBe(true);
    });

    it("rejects invalid memberId format", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}/assignMember`)
        .set("Cookie", leaderToken)
        .send({ memberId: "not-a-ulid" });

      expect(res.status).toBe(422);
    });
  });

  describe("PATCH /ministries/:ministryId/removeMember", () => {
    it("leader removes member from own ministry", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}/removeMember`)
        .set("Cookie", leaderToken)
        .send({ memberId: regularMemberId });

      expect(res.status).toBe(200);

      const link = await prisma.memberMinistry.findUnique({
        where: { memberId_ministryId: { memberId: regularMemberId, ministryId } },
      });
      expect(link).toBeNull();
    });

    it("returns idempotent success when member not in ministry", async () => {
      await request(app)
        .patch(`/ministries/${ministryId}/removeMember`)
        .set("Cookie", leaderToken)
        .send({ memberId: regularMemberId });

      const res = await request(app)
        .patch(`/ministries/${ministryId}/removeMember`)
        .set("Cookie", leaderToken)
        .send({ memberId: regularMemberId });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(regularMemberId);
    });

    it("returns 404 for non-existent ministry", async () => {
      const res = await request(app)
        .patch(`/ministries/${generateId()}/removeMember`)
        .set("Cookie", presidentToken)
        .send({ memberId: regularMemberId });

      expect(res.status).toBe(404);
    });

    it("returns 404 for non-existent member", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}/removeMember`)
        .set("Cookie", presidentToken)
        .send({ memberId: generateId() });

      expect(res.status).toBe(404);
    });

    it("PRESIDENT can remove from any ministry", async () => {
      const tempMemberId = generateId();
      await prisma.member.create({
        data: { id: tempMemberId, fullName: "Temp", normalizedFullName: "temp", birthDate: new Date("2000-01-01"), churchJoinDate: new Date() },
      });
      await prisma.memberMinistry.create({
        data: { memberId: tempMemberId, ministryId: otherMinistryId },
      });

      const res = await request(app)
        .patch(`/ministries/${otherMinistryId}/removeMember`)
        .set("Cookie", presidentToken)
        .send({ memberId: tempMemberId });

      expect(res.status).toBe(200);
    });
  });
});
