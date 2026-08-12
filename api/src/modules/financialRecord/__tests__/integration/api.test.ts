import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../../../../app";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase } from "../../../../__tests__/helpers";

const jwt = new JwtProvider();
function token(userId: string, level: number) {
  return jwt.signAccessToken({ userId, userLevel: level, sessionId: "s" });
}
function authCookie(userId: string, level: number) {
  return `accessToken=${token(userId, level)}`;
}

describe("API — PostgreSQL", () => {
  let prisma: PrismaClient;
  let tToken: string;
  let mToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.category.createMany({ data: [{ id: "cat-api-1", name: "Dízimo", type: "INCOME" }, { id: "cat-api-2", name: "Despesa", type: "EXPENSE" }] });
    await prisma.role.createMany({ data: [{ id: "r-t", name: "TREASURER", level: 80 }, { id: "r-m", name: "MEMBER", level: 10 }] });

    const t = await prisma.user.create({ data: { id: "u-t", email: "t@t.com", passwordHash: "h", isActive: true, roles: { create: { roleId: "r-t" } } } });
    const m = await prisma.user.create({ data: { id: "u-m", email: "m@t.com", passwordHash: "h", isActive: true, roles: { create: { roleId: "r-m" } } } });

    tToken = authCookie(t.id, 80);
    mToken = authCookie(m.id, 10);
  });

  afterAll(async () => { await cleanIntegrationDatabase(prisma); await prisma.$disconnect(); });

  it("POST /financial-records → 201", async () => {
    const res = await request(app).post("/financial-records").set("Cookie", tToken).send({ amount: 500, method: "PIX", date: new Date().toISOString(), categoryId: "cat-api-1", recordedById: "u-t" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it("POST /:id/reverse → 200", async () => {
    const c = await request(app).post("/financial-records").set("Cookie", tToken).send({ amount: 300, method: "PIX", date: new Date().toISOString(), categoryId: "cat-api-1", recordedById: "u-t" });
    const res = await request(app).post(`/financial-records/${c.body.id}/reverse`).set("Cookie", tToken).send({ reason: "Test" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("REVERSED");
  });

  it("retry → 200 + alreadyReversed", async () => {
    const c = await request(app).post("/financial-records").set("Cookie", tToken).send({ amount: 150, method: "PIX", date: new Date().toISOString(), categoryId: "cat-api-1", recordedById: "u-t" });
    await request(app).post(`/financial-records/${c.body.id}/reverse`).set("Cookie", tToken).send({ reason: "1" });
    const r = await request(app).post(`/financial-records/${c.body.id}/reverse`).set("Cookie", tToken).send({ reason: "2" });
    expect(r.status).toBe(200);
    expect(r.body.alreadyReversed).toBe(true);
  });

  it("PATCH /:id/delete → 200", async () => {
    const c = await request(app).post("/financial-records").set("Cookie", tToken).send({ amount: 200, method: "CASH", date: new Date().toISOString(), categoryId: "cat-api-1", recordedById: "u-t" });
    const r = await request(app).patch(`/financial-records/${c.body.id}/delete`).set("Cookie", tToken).send({ reason: "T" });
    expect(r.status).toBe(200);
  });

  it("sem token → 401", async () => {
    expect((await request(app).post("/financial-records/x/reverse").send({})).status).toBe(401);
  });

  it("MEMBER → 403", async () => {
    expect((await request(app).post("/financial-records/x/reverse").set("Cookie", mToken).send({})).status).toBe(403);
  });

  it("inexistente → 404", async () => {
    expect((await request(app).post("/financial-records/non-existent/reverse").set("Cookie", tToken).send({})).status).toBe(404);
  });

  it("já cancelado → 409", async () => {
    const c = await request(app).post("/financial-records").set("Cookie", tToken).send({ amount: 100, method: "PIX", date: new Date().toISOString(), categoryId: "cat-api-1", recordedById: "u-t" });
    await request(app).patch(`/financial-records/${c.body.id}/delete`).set("Cookie", tToken).send({ reason: "1" });
    expect((await request(app).patch(`/financial-records/${c.body.id}/delete`).set("Cookie", tToken).send({ reason: "2" })).status).toBe(409);
  });

  it("GET /financial-records → 200, sem CANCELLED", async () => {
    const r = await request(app).get("/financial-records").set("Cookie", tToken);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
    for (const rec of r.body) expect(rec.status).not.toBe("CANCELLED");
  });
});
