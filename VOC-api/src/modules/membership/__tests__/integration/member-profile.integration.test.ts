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

describe("0H.3A — Complete profile (PATCH /members/me/complete-profile)", () => {
  let prisma: PrismaClient;
  const userId = "u-pro-user";
  const otherUserId = "u-pro-other";

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-pro", name: "MEMBER", level: 10 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: userId, email: "pro@test.com", passwordHash: "h", isActive: true },
        { id: otherUserId, email: "pro-other@test.com", passwordHash: "h", isActive: true },
        { id: "u-pro-extra", email: "extra@test.com", passwordHash: "h", isActive: true },
        { id: "u-pro-busy", email: "busy@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId, roleId: "r-pro" },
        { userId: otherUserId, roleId: "r-pro" },
        { userId: "u-pro-extra", roleId: "r-pro" },
        { userId: "u-pro-busy", roleId: "r-pro" },
      ],
    });
  });

  afterAll(async () => {
    await cleanIntegrationDatabase(prisma);
    await prisma.$disconnect();
  });

  it("PATCH /members/me/complete-profile — 200 links member to authenticated user", async () => {
    const res = await request(app)
      .patch("/members/me/complete-profile")
      .set("Cookie", authCookie(userId, 10))
      .send({
        fullName: "Complete Profile User",
        birthDate: "1990-01-15",
        phone: "(11) 91111-1111",
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: expect.any(String) });

    const member = await prisma.member.findUnique({ where: { id: res.body.id } });
    expect(member?.userId).toBe(userId);
  });

  it("PATCH /members/me/complete-profile — 401 without token", async () => {
    const res = await request(app)
      .patch("/members/me/complete-profile")
      .send({ fullName: "No Auth", birthDate: "1990-01-01" });

    expect(res.status).toBe(401);
  });

  it("PATCH /members/me/complete-profile — 422 invalid birthDate", async () => {
    const res = await request(app)
      .patch("/members/me/complete-profile")
      .set("Cookie", authCookie("u-pro-extra", 10))
      .send({ fullName: "Bad Date", birthDate: "not-a-date" });

    expect(res.status).toBe(422);
  });

  it("PATCH /members/me/complete-profile — 422 administrative fields rejected", async () => {
    const res = await request(app)
      .patch("/members/me/complete-profile")
      .set("Cookie", authCookie("u-pro-extra", 10))
      .send({
        fullName: "Admin Field Attempt",
        birthDate: "1995-03-10",
        phone: "(11) 91111-1112",
        status: "PRESIDENT",
        deletedAt: "2020-01-01",
      });

    expect(res.status).toBe(422);
  });

  it("PATCH /members/me/complete-profile — 409 member already linked to another user", async () => {
    const memberId = generateId();
    await prisma.member.create({
      data: {
        id: memberId,
        fullName: "Already Linked",
        normalizedFullName: "already linked",
        birthDate: new Date("1988-05-20"),
        churchJoinDate: new Date(),
        userId: otherUserId,
      },
    });

    const res = await request(app)
      .patch("/members/me/complete-profile")
      .set("Cookie", authCookie(userId, 10))
      .send({
        fullName: "Already Linked",
        birthDate: "1988-05-20",
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(memberId);
  });

  it("PATCH /members/me/complete-profile — soft-deleted member returns 409", async () => {
    const memberId = generateId();
    await prisma.member.create({
      data: {
        id: memberId,
        fullName: "Soft Deleted Profile",
        normalizedFullName: "soft deleted profile",
        birthDate: new Date("1992-07-10"),
        churchJoinDate: new Date(),
        deletedAt: new Date(),
      },
    });

    const res = await request(app)
      .patch("/members/me/complete-profile")
      .set("Cookie", authCookie(userId, 10))
      .send({
        fullName: "Soft Deleted Profile",
        birthDate: "1992-07-10",
        phone: "(11) 91111-1113",
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("MEMBER_REGISTRATION_CONFLICT");
  });

  it("PATCH /members/me/complete-profile — 422 missing fullName", async () => {
    const res = await request(app)
      .patch("/members/me/complete-profile")
      .set("Cookie", authCookie(userId, 10))
      .send({ birthDate: "1990-01-01" });

    expect(res.status).toBe(422);
  });

  it("PATCH /members/me/complete-profile — 422 missing birthDate", async () => {
    const res = await request(app)
      .patch("/members/me/complete-profile")
      .set("Cookie", authCookie(userId, 10))
      .send({ fullName: "Only Name" });

    expect(res.status).toBe(422);
  });
});
