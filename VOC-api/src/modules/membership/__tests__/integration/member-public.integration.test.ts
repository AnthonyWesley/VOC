import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../../../../app";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase } from "../../../../__tests__/helpers";

describe("0H.3A — Public member registration", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);
    await prisma.role.createMany({
      data: [
        { id: "r-pub", name: "MEMBER", level: 10 },
      ],
    });
  });

  afterAll(async () => {
    await cleanIntegrationDatabase(prisma);
    await prisma.$disconnect();
  });

  it("POST /members/public/register — 201 minimum valid (minor, no phone needed)", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({ fullName: "Maria Silva", birthDate: "2015-05-15" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: expect.any(String) });

    const member = await prisma.member.findUnique({ where: { id: res.body.id } });
    expect(member).not.toBeNull();
    expect(member!.normalizedFullName).toBe("maria silva");
  });

  it("POST /members/public/register — 201 with all optional fields", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({
        fullName: "João Santos",
        nickname: "Joãozinho",
        birthDate: "1985-03-20",
        phone: "(11) 99999-8888",
        postcode: "01234-567",
        address: "Rua das Flores, 123",
        baptismDate: "2010-01-10",
        churchJoinDate: "2024-06-01",
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: expect.any(String) });

    const member = await prisma.member.findUnique({ where: { id: res.body.id } });
    expect(member!.nickname).toBe("Joãozinho");
    expect(member!.phone).toBe("+5511999998888");
    expect(member!.postcode).toBe("01234-567");
    expect(member!.address).toBe("Rua das Flores, 123");
  });

  it("POST /members/public/register — 422 missing fullName", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({ birthDate: "1990-01-01" });

    expect(res.status).toBe(422);
  });

  it("POST /members/public/register — 422 missing birthDate", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({ fullName: "Test User" });

    expect(res.status).toBe(422);
  });

  it("POST /members/public/register — 422 invalid birthDate", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({ fullName: "Test User", birthDate: "not-a-date" });

    expect(res.status).toBe(422);
  });

  it("POST /members/public/register — 422 future birthDate", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({ fullName: "Test User", birthDate: "2100-01-01" });

    expect(res.status).toBe(422);
  });

  it("POST /members/public/register — 422 impossible date like 2026-02-31", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({ fullName: "Test User", birthDate: "2026-02-31" });

    expect(res.status).toBe(422);
  });

  it("POST /members/public/register — 422 phone required for 16+", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({ fullName: "Adult User", birthDate: "2000-01-01" });

    expect(res.status).toBe(422);
  });

  it("POST /members/public/register — 422 administrative fields rejected (userId)", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({
        fullName: "Hacker",
        birthDate: "2005-06-15",
        phone: "(11) 99999-0000",
        userId: "u-hacked",
        status: "ACTIVE",
      });

    expect(res.status).toBe(422);
  });

  it("POST /members/public/register — 200 idempotent duplicate", async () => {
    const first = await request(app)
      .post("/members/public/register")
      .send({ fullName: "Idempotent User", birthDate: "1995-10-10", phone: "(11) 91111-1111" });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/members/public/register")
      .send({ fullName: "Idempotent User", birthDate: "1995-10-10", phone: "(11) 92222-2222" });
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);

    const count = await prisma.member.count({
      where: { normalizedFullName: "idempotent user", deletedAt: null },
    });
    expect(count).toBe(1);
  });

  it("POST /members/public/register — 200 case-insensitive duplicate", async () => {
    const first = await request(app)
      .post("/members/public/register")
      .send({ fullName: "Case Test", birthDate: "1992-03-15", phone: "(11) 91111-1112" });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/members/public/register")
      .send({ fullName: "case test", birthDate: "1992-03-15", phone: "(11) 99999-0000" });
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
  });

  it("POST /members/public/register — 409 soft-deleted duplicate", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({ fullName: "To Be Deleted", birthDate: "1988-07-22", phone: "(11) 91111-1113" });
    expect(res.status).toBe(201);

    await prisma.member.update({
      where: { id: res.body.id },
      data: { deletedAt: new Date() },
    });

    const retry = await request(app)
      .post("/members/public/register")
      .send({ fullName: "To Be Deleted", birthDate: "1988-07-22", phone: "(11) 91111-1114" });
    expect(retry.status).toBe(409);
    expect(retry.body.code).toBe("MEMBER_REGISTRATION_CONFLICT");

    const count = await prisma.member.count({
      where: { normalizedFullName: "to be deleted" },
    });
    expect(count).toBe(1);
  });

  it("POST /members/public/register — name with extra spaces normalized", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({ fullName: "  Spaced  Name  ", birthDate: "2000-01-01", phone: "(11) 91111-1115" });
    expect(res.status).toBe(201);

    const member = await prisma.member.findUnique({ where: { id: res.body.id } });
    expect(member!.normalizedFullName).toBe("spaced  name");
  });

  it("POST /members/public/register — response does not expose internal fields", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({ fullName: "Private User", birthDate: "1998-12-01", phone: "(11) 91111-1116" });

    expect(res.status).toBe(201);
    expect(Object.keys(res.body)).toEqual(["id"]);
  });

  it("POST /members/public/register — 422 birthDate empty string", async () => {
    const res = await request(app)
      .post("/members/public/register")
      .send({ fullName: "Test User", birthDate: "" });

    expect(res.status).toBe(422);
  });
});
