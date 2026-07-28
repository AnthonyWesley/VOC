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

describe("0H.3A — Admin member CRUD", () => {
  let prisma: PrismaClient;
  const presidentId = "u-adm-pres";
  const memberUserId = "u-adm-member";
  const presidentToken = authCookie(presidentId, 100);
  const memberToken = authCookie(memberUserId, 10);
  const existingMemberId = generateId();

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-adm-pres", name: "PRESIDENT", level: 100 },
        { id: "r-adm-member", name: "MEMBER", level: 10 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: presidentId, email: "adm-pres@test.com", passwordHash: "h", isActive: true },
        { id: memberUserId, email: "adm-member@test.com", passwordHash: "h", isActive: true },
        { id: "u-adm-extra", email: "adm-extra@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: presidentId, roleId: "r-adm-pres" },
        { userId: memberUserId, roleId: "r-adm-member" },
        { userId: "u-adm-extra", roleId: "r-adm-pres" },
      ],
    });

    await prisma.member.create({
      data: {
        id: existingMemberId,
        fullName: "Existing Member",
        normalizedFullName: "existing member",
        birthDate: new Date("1990-06-15"),
        churchJoinDate: new Date(),
        phone: "+5511999990001",
        userId: "u-adm-extra",
      },
    });
  });

  afterAll(async () => {
    await cleanIntegrationDatabase(prisma);
    await prisma.$disconnect();
  });

  describe("POST /members — Create (PRESIDENT only)", () => {
    it("201 creates member", async () => {
      const res = await request(app)
        .post("/members")
        .set("Cookie", presidentToken)
        .send({ fullName: "New Admin Member", birthDate: "1995-03-10", phone: "(11) 91111-0001" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ id: expect.any(String) });

      const member = await prisma.member.findUnique({ where: { id: res.body.id } });
      expect(member).not.toBeNull();
    });

    it("401 without auth", async () => {
      const res = await request(app)
        .post("/members")
        .send({ fullName: "No Auth", birthDate: "1995-03-10" });

      expect(res.status).toBe(401);
    });

    it("403 with MEMBER level", async () => {
      const res = await request(app)
        .post("/members")
        .set("Cookie", memberToken)
        .send({ fullName: "Low Level", birthDate: "1995-03-10" });

      expect(res.status).toBe(403);
    });

    it("422 missing fields", async () => {
      const res = await request(app)
        .post("/members")
        .set("Cookie", presidentToken)
        .send({});

      expect(res.status).toBe(422);
    });

    it("200 duplicate returns existing id", async () => {
      const res = await request(app)
        .post("/members")
        .set("Cookie", presidentToken)
        .send({ fullName: "Existing Member", birthDate: "1990-06-15", phone: "(11) 99999-9999" });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(existingMemberId);
    });

    it("409 soft-deleted duplicate requires reactivation", async () => {
      const delId = generateId();
      await prisma.member.create({
        data: {
          id: delId,
          fullName: "Needs Reactivation",
          normalizedFullName: "needs reactivation",
          birthDate: new Date("1985-11-20"),
          churchJoinDate: new Date(),
          deletedAt: new Date(),
        },
      });

      const res = await request(app)
        .post("/members")
        .set("Cookie", presidentToken)
        .send({ fullName: "Needs Reactivation", birthDate: "1985-11-20" });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("MEMBER_REACTIVATION_REQUIRED");
    });
  });

  describe("GET /members/:memberId — Get detailed (MEMBER+)", () => {
    it("200 returns detailed member", async () => {
      const res = await request(app)
        .get(`/members/${existingMemberId}`)
        .set("Cookie", memberToken);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(existingMemberId);
      expect(res.body.fullName).toBe("Existing Member");
      expect(res.body).not.toHaveProperty("passwordHash");
      expect(res.body).not.toHaveProperty("password");
    });

    it("404 for non-existent member", async () => {
      const res = await request(app)
        .get("/members/non-existent-id")
        .set("Cookie", memberToken);

      expect(res.status).toBe(404);
    });

    it("404 for soft-deleted member", async () => {
      const delId = generateId();
      await prisma.member.create({
        data: {
          id: delId,
          fullName: "Gone Member",
          normalizedFullName: "gone member",
          birthDate: new Date("2000-01-01"),
          churchJoinDate: new Date(),
          deletedAt: new Date(),
        },
      });

      const res = await request(app)
        .get(`/members/${delId}`)
        .set("Cookie", memberToken);

      expect(res.status).toBe(404);
    });

    it("401 without auth", async () => {
      const res = await request(app).get(`/members/${existingMemberId}`);
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /members/:memberId — Update (PRESIDENT only)", () => {
    it("200 updates fields", async () => {
      const targetId = generateId();
      await prisma.member.create({
        data: {
          id: targetId,
          fullName: "Update Target",
          normalizedFullName: "update target",
          birthDate: new Date("1992-08-10"),
          churchJoinDate: new Date(),
        },
      });

      const res = await request(app)
        .patch(`/members/${targetId}`)
        .set("Cookie", presidentToken)
        .send({ fullName: "Updated Name", nickname: "Nick" });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(targetId);

      const member = await prisma.member.findUnique({ where: { id: targetId } });
      expect(member!.fullName).toBe("Updated Name");
      expect(member!.nickname).toBe("Nick");
    });

    it("401 without auth", async () => {
      const res = await request(app)
        .patch(`/members/${existingMemberId}`)
        .send({ fullName: "Hacker" });

      expect(res.status).toBe(401);
    });

    it("403 with MEMBER level", async () => {
      const res = await request(app)
        .patch(`/members/${existingMemberId}`)
        .set("Cookie", memberToken)
        .send({ fullName: "Hacker" });

      expect(res.status).toBe(403);
    });

    it("404 for non-existent member", async () => {
      const res = await request(app)
        .patch("/members/non-existent-id")
        .set("Cookie", presidentToken)
        .send({ fullName: "Ghost" });

      expect(res.status).toBe(404);
    });

    it("404 for soft-deleted member", async () => {
      const delId = generateId();
      await prisma.member.create({
        data: {
          id: delId,
          fullName: "Deleted Update Target",
          normalizedFullName: "deleted update target",
          birthDate: new Date("1998-04-15"),
          churchJoinDate: new Date(),
          deletedAt: new Date(),
        },
      });

      const res = await request(app)
        .patch(`/members/${delId}`)
        .set("Cookie", presidentToken)
        .send({ fullName: "Should Fail" });

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /members/:memberId/delete — Soft delete (PRESIDENT only)", () => {
    it("204 soft-deletes member", async () => {
      const targetId = generateId();
      await prisma.member.create({
        data: {
          id: targetId,
          fullName: "Delete Target",
          normalizedFullName: "delete target",
          birthDate: new Date("1980-02-20"),
          churchJoinDate: new Date(),
        },
      });

      const res = await request(app)
        .patch(`/members/${targetId}/delete`)
        .set("Cookie", presidentToken);

      expect(res.status).toBe(204);

      const member = await prisma.member.findUnique({ where: { id: targetId } });
      expect(member!.deletedAt).not.toBeNull();
    });

    it("401 without auth", async () => {
      const res = await request(app).patch(`/members/${existingMemberId}/delete`);
      expect(res.status).toBe(401);
    });

    it("403 with MEMBER level", async () => {
      const res = await request(app)
        .patch(`/members/${existingMemberId}/delete`)
        .set("Cookie", memberToken);

      expect(res.status).toBe(403);
    });

    it("404 for non-existent member", async () => {
      const res = await request(app)
        .patch("/members/non-existent-id/delete")
        .set("Cookie", presidentToken);

      expect(res.status).toBe(404);
    });

    it("second delete returns 404 (already deleted)", async () => {
      const targetId = generateId();
      await prisma.member.create({
        data: {
          id: targetId,
          fullName: "Double Delete",
          normalizedFullName: "double delete",
          birthDate: new Date("1975-12-01"),
          churchJoinDate: new Date(),
          deletedAt: new Date(),
        },
      });

      const res = await request(app)
        .patch(`/members/${targetId}/delete`)
        .set("Cookie", presidentToken);

      expect(res.status).toBe(204);
    });
  });
});


