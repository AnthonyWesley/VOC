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

describe("0H.3B — Ministry list", () => {
  let prisma: PrismaClient;
  const userId = "u-list-user";
  const userToken = authCookie(userId, 10);
  const leaderMemberId = generateId();
  const memberId = generateId();

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-list-member", name: "MEMBER", level: 10 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: userId, email: "list@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId, roleId: "r-list-member" },
      ],
    });

    await prisma.member.createMany({
      data: [
        { id: leaderMemberId, fullName: "List Leader", normalizedFullName: "list leader", birthDate: new Date("1990-01-01"), churchJoinDate: new Date() },
        { id: memberId, fullName: "List Member", normalizedFullName: "list member", birthDate: new Date("1995-06-15"), churchJoinDate: new Date() },
      ],
    });

    await prisma.ministry.createMany({
      data: [
        { id: generateId(), name: "Z Ministry", description: "Last alphabetically", leaderId: leaderMemberId },
        { id: generateId(), name: "A Ministry", description: "First alphabetically" },
      ],
    });

    const midMinistryId = generateId();
    await prisma.ministry.create({
      data: { id: midMinistryId, name: "M Ministry", leaderId: leaderMemberId },
    });

    await prisma.memberMinistry.create({
      data: { memberId, ministryId: midMinistryId },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /ministries", () => {
    it("returns all ministries with leader info and member count", async () => {
      const res = await request(app)
        .get("/ministries")
        .set("Cookie", userToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);

      const mMinistry = res.body.find((m: any) => m.name === "M Ministry");
      expect(mMinistry).toBeDefined();
      expect(mMinistry.leaderId).toBe(leaderMemberId);
      expect(mMinistry.memberCount).toBe(1);

      const aMinistry = res.body.find((m: any) => m.name === "A Ministry");
      expect(aMinistry).toBeDefined();
      expect(aMinistry.leaderId).toBeNull();
      expect(aMinistry.memberCount).toBe(0);
    });

    it("avoids exposing sensitive data", async () => {
      const res = await request(app)
        .get("/ministries")
        .set("Cookie", userToken);

      const keys = Object.keys(res.body[0]);
      expect(keys).not.toContain("passwordHash");
      expect(keys).not.toContain("email");
    });

    it("returns 401 without auth", async () => {
      const res = await request(app)
        .get("/ministries");

      expect(res.status).toBe(401);
    });

    it("returns empty array when no ministries exist", async () => {
      const tempPrisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
      await tempPrisma.ministry.deleteMany();
      await tempPrisma.$disconnect();

      const res = await request(app)
        .get("/ministries")
        .set("Cookie", userToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
