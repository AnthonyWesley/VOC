import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../../../../app";
import { INTEGRATION_DATABASE_URL } from "../../../../__tests__/helpers";

describe("Health Routes — API", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /health/live returns 200", async () => {
    const res = await request(app).get("/health/live");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /health/ready returns 200 when DB is up", async () => {
    const res = await request(app).get("/health/ready");
    expect(res.status).toBe(200);
    expect(res.body.dependencies.database).toBe("up");
    expect(res.body).not.toHaveProperty("lockedBy");
    expect(res.body).not.toHaveProperty("details");
    expect(res.body).not.toHaveProperty("stack");
  });

  it("GET /health/ready returns ok with configured or not_configured whatsapp", async () => {
    const res = await request(app).get("/health/ready");
    expect(res.status).toBe(200);
    expect(["configured", "not_configured"]).toContain(res.body.dependencies.whatsapp);
  });
});
