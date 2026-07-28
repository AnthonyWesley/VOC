import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../../../../app";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase } from "../../../../__tests__/helpers";
import { generateId } from "../../../../shared/utils/generateId";
import { ulidSchema } from "../../../../shared/utils/ulidSchema";

const jwt = new JwtProvider();

function authCookie(userId: string, level: number) {
  return `accessToken=${jwt.signAccessToken({ userId, userLevel: level, sessionId: "s" })}`;
}

describe("0H.3B — Ministry CRUD", () => {
  let prisma: PrismaClient;
  const presidentId = "u-crud-pres";
  const leaderId = "u-crud-leader";
  const memberUserId = "u-crud-member";
  const presidentToken = authCookie(presidentId, 100);
  const leaderToken = authCookie(leaderId, 40);
  const memberToken = authCookie(memberUserId, 10);

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-crud-pres", name: "PRESIDENT", level: 100 },
        { id: "r-crud-leader", name: "MINISTRY_LEADER", level: 40 },
        { id: "r-crud-member", name: "MEMBER", level: 10 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: presidentId, email: "crud-pres@test.com", passwordHash: "h", isActive: true },
        { id: leaderId, email: "crud-leader@test.com", passwordHash: "h", isActive: true },
        { id: memberUserId, email: "crud-member@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: presidentId, roleId: "r-crud-pres" },
        { userId: leaderId, roleId: "r-crud-leader" },
        { userId: memberUserId, roleId: "r-crud-member" },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /ministries", () => {
    it("creates a ministry and returns 201 with ULID id", async () => {
      const res = await request(app)
        .post("/ministries")
        .set("Cookie", presidentToken)
        .send({ name: "Louvor", description: "Ministério de louvor" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(() => ulidSchema.parse(res.body.id)).not.toThrow();

      const saved = await prisma.ministry.findUnique({ where: { id: res.body.id } });
      expect(saved).not.toBeNull();
      expect(saved!.name).toBe("Louvor");
      expect(saved!.description).toBe("Ministério de louvor");
    });

    it("returns 401 without auth", async () => {
      const res = await request(app)
        .post("/ministries")
        .send({ name: "No Auth" });

      expect(res.status).toBe(401);
    });

    it("returns 403 for MEMBER level", async () => {
      const res = await request(app)
        .post("/ministries")
        .set("Cookie", memberToken)
        .send({ name: "Member Test" });

      expect(res.status).toBe(403);
    });

    it("returns 422 for empty name", async () => {
      const res = await request(app)
        .post("/ministries")
        .set("Cookie", presidentToken)
        .send({ name: "", description: "Empty name" });

      expect(res.status).toBe(422);
    });

    it("accepts ministry without description", async () => {
      const res = await request(app)
        .post("/ministries")
        .set("Cookie", presidentToken)
        .send({ name: "Sem Descrição" });

      expect(res.status).toBe(201);
    });

    it("accepts ministry with null description", async () => {
      const res = await request(app)
        .post("/ministries")
        .set("Cookie", presidentToken)
        .send({ name: "Desc Null", description: null });

      expect(res.status).toBe(201);
    });

    it("returns 409 for duplicate name", async () => {
      await request(app)
        .post("/ministries")
        .set("Cookie", presidentToken)
        .send({ name: "Unico" });

      const res = await request(app)
        .post("/ministries")
        .set("Cookie", presidentToken)
        .send({ name: "Unico" });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("MINISTRY_NAME_CONFLICT");
    });

    it("rejects extra fields (strict)", async () => {
      const res = await request(app)
        .post("/ministries")
        .set("Cookie", presidentToken)
        .send({ name: "Strict Test", extraField: true });

      expect(res.status).toBe(422);
    });
  });

  describe("PATCH /ministries/:ministryId", () => {
    let ministryId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post("/ministries")
        .set("Cookie", presidentToken)
        .send({ name: "Update Test" });
      ministryId = res.body.id;
    });

    it("updates name and description", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}`)
        .set("Cookie", presidentToken)
        .send({ name: "Updated Name", description: "Updated desc" });

      expect(res.status).toBe(200);

      const saved = await prisma.ministry.findUnique({ where: { id: ministryId } });
      expect(saved!.name).toBe("Updated Name");
      expect(saved!.description).toBe("Updated desc");
    });

    it("sets description to null", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}`)
        .set("Cookie", presidentToken)
        .send({ description: null });

      expect(res.status).toBe(200);

      const saved = await prisma.ministry.findUnique({ where: { id: ministryId } });
      expect(saved!.description).toBeNull();
    });

    it("rejects empty body (NO_CHANGES)", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}`)
        .set("Cookie", presidentToken)
        .send({});

      expect(res.status).toBe(422);
    });

    it("returns 404 for non-existent ministry", async () => {
      const fakeId = generateId();
      const res = await request(app)
        .patch(`/ministries/${fakeId}`)
        .set("Cookie", presidentToken)
        .send({ name: "Fake" });

      expect(res.status).toBe(404);
    });

    it("returns 409 for duplicate name on update", async () => {
      await request(app)
        .post("/ministries")
        .set("Cookie", presidentToken)
        .send({ name: "Existing Name" });

      const res = await request(app)
        .patch(`/ministries/${ministryId}`)
        .set("Cookie", presidentToken)
        .send({ name: "Existing Name" });

      expect(res.status).toBe(409);
    });

    it("returns 401 without auth", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}`)
        .send({ name: "No Auth" });

      expect(res.status).toBe(401);
    });

    it("returns 403 for MEMBER level", async () => {
      const res = await request(app)
        .patch(`/ministries/${ministryId}`)
        .set("Cookie", memberToken)
        .send({ name: "Member Update" });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /ministries/:ministryId", () => {
    it("returns 404 for non-existent ministry", async () => {
      const fakeId = generateId();
      const res = await request(app)
        .get(`/ministries/${fakeId}`)
        .set("Cookie", presidentToken);

      expect(res.status).toBe(404);
    });

    it("returns 200 with ministry details", async () => {
      const createRes = await request(app)
        .post("/ministries")
        .set("Cookie", presidentToken)
        .send({ name: "Detail Test" });

      const res = await request(app)
        .get(`/ministries/${createRes.body.id}`)
        .set("Cookie", presidentToken);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Detail Test");
    });

    it("returns 401 without auth", async () => {
      const res = await request(app)
        .get(`/ministries/${generateId()}`);

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /ministries/:ministryId/delete", () => {
    it("deletes empty ministry and returns 204", async () => {
      const createRes = await request(app)
        .post("/ministries")
        .set("Cookie", presidentToken)
        .send({ name: "To Delete" });

      const res = await request(app)
        .patch(`/ministries/${createRes.body.id}/delete`)
        .set("Cookie", presidentToken);

      expect(res.status).toBe(204);

      const saved = await prisma.ministry.findUnique({ where: { id: createRes.body.id } });
      expect(saved).toBeNull();
    });

    it("returns 404 for non-existent ministry", async () => {
      const res = await request(app)
        .patch(`/ministries/${generateId()}/delete`)
        .set("Cookie", presidentToken);

      expect(res.status).toBe(404);
    });

    it("returns 409 for ministry with event assignments", async () => {
      const leaderMemberId = generateId();
      const memberId = generateId();
      const eventId = generateId();

      await prisma.member.create({
        data: { id: leaderMemberId, fullName: "Leader", normalizedFullName: "leader", birthDate: new Date(), churchJoinDate: new Date() },
      });
      await prisma.member.create({
        data: { id: memberId, fullName: "Member", normalizedFullName: "member", birthDate: new Date(), churchJoinDate: new Date() },
      });

      const createRes = await request(app)
        .post("/ministries")
        .set("Cookie", presidentToken)
        .send({ name: "Busy Ministry" });
      const ministryId = createRes.body.id;

      await prisma.event.create({
        data: { id: eventId, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date(), title: "Event", attendanceMode: "INDIVIDUAL" },
      });
      await prisma.eventAssignment.create({
        data: { id: generateId(), eventId, memberId, ministryId },
      });

      const res = await request(app)
        .patch(`/ministries/${ministryId}/delete`)
        .set("Cookie", presidentToken);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("MINISTRY_IN_USE");
    });

    it("returns 401 without auth", async () => {
      const res = await request(app)
        .patch(`/ministries/${generateId()}/delete`);

      expect(res.status).toBe(401);
    });

    it("returns 403 for MEMBER level", async () => {
      const res = await request(app)
        .patch(`/ministries/${generateId()}/delete`)
        .set("Cookie", memberToken);

      expect(res.status).toBe(403);
    });
  });
});
