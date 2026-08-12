import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../../../../app";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { INTEGRATION_DATABASE_URL } from "../../../../__tests__/helpers";

const jwt = new JwtProvider();

function authCookie(userId: string, level: number) {
  return `accessToken=${jwt.signAccessToken({ userId, userLevel: level, sessionId: "s" })}`;
}

describe("Admin Routes — API", () => {
  let prisma: PrismaClient;
  let presidentToken: string;
  let memberToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await prisma.$executeRawUnsafe(`DELETE FROM "JobLease"`);

    await prisma.role.upsert({
      where: { id: "r-admin-pres" },
      update: {},
      create: { id: "r-admin-pres", name: "PRESIDENT", level: 100 },
    });
    await prisma.role.upsert({
      where: { id: "r-admin-member" },
      update: {},
      create: { id: "r-admin-member", name: "MEMBER", level: 10 },
    });

    const pres = await prisma.user.create({
      data: {
        id: "u-admin-pres",
        email: "pres@admin.com",
        passwordHash: "h",
        isActive: true,
        roles: { create: { roleId: "r-admin-pres" } },
      },
    });

    const member = await prisma.user.create({
      data: {
        id: "u-admin-member",
        email: "member@admin.com",
        passwordHash: "h",
        isActive: true,
        roles: { create: { roleId: "r-admin-member" } },
      },
    });

    presidentToken = authCookie(pres.id, 100);
    memberToken = authCookie(member.id, 10);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM "JobLease"`);
  });

  it("GET /admin/jobs/inactive-members — metadata does not contain lockedBy", async () => {
    const res = await request(app).get("/admin/jobs/inactive-members").set("Cookie", presidentToken);
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("lockedBy");
    expect(res.body.name).toBe("inactive-members");
    expect(res.body).toHaveProperty("running");
    expect(res.body).toHaveProperty("lockedUntil");
  });

  it("POST /admin/jobs/inactive-members/run — sem token → 401", async () => {
    const res = await request(app).post("/admin/jobs/inactive-members/run").send({});
    expect(res.status).toBe(401);
  });

  it("POST /admin/jobs/inactive-members/run — MEMBER → 403", async () => {
    const res = await request(app).post("/admin/jobs/inactive-members/run").set("Cookie", memberToken).send({});
    expect(res.status).toBe(403);
  });

  it("POST /admin/jobs/inactive-members/run — PRESIDENT → 200 COMPLETED", async () => {
    const res = await request(app).post("/admin/jobs/inactive-members/run").set("Cookie", presidentToken).send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("COMPLETED");
    expect(res.body).not.toHaveProperty("lockedBy");
  });

  it("POST /admin/jobs/inactive-members/run — JOB_ALREADY_RUNNING → 409", async () => {
    // Simulate an active lease so the job appears already running
    await prisma.$executeRawUnsafe(
      `INSERT INTO "JobLease" ("name", "lockedBy", "lockedUntil", "updatedAt") VALUES ('inactive-members', 'test-simulator', NOW() + INTERVAL '60 seconds', NOW()) ON CONFLICT ("name") DO UPDATE SET "lockedUntil" = EXCLUDED."lockedUntil"`,
    );

    const res = await request(app).post("/admin/jobs/inactive-members/run").set("Cookie", presidentToken).send({});
    expect(res.status).toBe(409);
    expect(res.body.status).toBe("SKIPPED");
    expect(res.body.message).toBe("Job is already running on another instance");
  });

  it("POST /admin/jobs/inactive-members/run — rate limit → 429", async () => {
    // Send requests until rate limited (previous tests may have consumed slots)
    let got429 = false;
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post("/admin/jobs/inactive-members/run").set("Cookie", presidentToken).send({});
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    expect(got429).toBe(true);
  });
});
