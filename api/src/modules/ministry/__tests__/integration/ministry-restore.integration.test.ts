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

describe("0I.5 — PATCH /ministries/:ministryId/restore", () => {
  let prisma: PrismaClient;
  const presidentId = "u-rest-pres-id";
  const memberUserId = "u-rest-member-id";
  const presidentToken = authCookie(presidentId, 100);
  const memberToken = authCookie(memberUserId, 10);

  const deletedMinistryId = generateId();
  const activeMinistryId = generateId();
  const nonexistentMinistryId = generateId();
  const concurrencyMinistryId = generateId();

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-rest-pres", name: "PRESIDENT", level: 100 },
        { id: "r-rest-member", name: "MEMBER", level: 10 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: presidentId, email: "rest-pres@test.com", passwordHash: "h", isActive: true },
        { id: memberUserId, email: "rest-member@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: presidentId, roleId: "r-rest-pres" },
        { userId: memberUserId, roleId: "r-rest-member" },
      ],
    });

    const memberId = generateId();
    await prisma.member.create({
      data: {
        id: memberId,
        fullName: "Restore Member",
        normalizedFullName: "restore member",
        birthDate: new Date("1990-05-20"),
        churchJoinDate: new Date(),
      },
    });

    const deletedAt = new Date("2026-08-01T10:00:00Z");
    await prisma.ministry.create({
      data: {
        id: deletedMinistryId,
        name: "Deleted Ministry",
        deletedAt,
        members: { create: { memberId, joinedAt: new Date() } },
      },
    });
    await prisma.ministry.create({
      data: { id: activeMinistryId, name: "Active Ministry" },
    });
    await prisma.ministry.create({
      data: {
        id: concurrencyMinistryId,
        name: "Concurrency Ministry",
        deletedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("401 sem auth", async () => {
    const res = await request(app)
      .patch(`/ministries/${deletedMinistryId}/restore`)
      .send({ reason: "motivo" });

    expect(res.status).toBe(401);
  });

  it("403 abaixo de PRESIDENT", async () => {
    const res = await request(app)
      .patch(`/ministries/${deletedMinistryId}/restore`)
      .set("Cookie", memberToken)
      .send({ reason: "motivo" });

    expect(res.status).toBe(403);
  });

  it("422 reason ausente", async () => {
    const res = await request(app)
      .patch(`/ministries/${deletedMinistryId}/restore`)
      .set("Cookie", presidentToken)
      .send({});

    expect(res.status).toBe(422);
  });

  it("422 reason curto", async () => {
    const res = await request(app)
      .patch(`/ministries/${deletedMinistryId}/restore`)
      .set("Cookie", presidentToken)
      .send({ reason: "ab" });

    expect(res.status).toBe(422);
  });

  it("404 ministério inexistente", async () => {
    const res = await request(app)
      .patch(`/ministries/${nonexistentMinistryId}/restore`)
      .set("Cookie", presidentToken)
      .send({ reason: "motivo" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("MINISTRY_NOT_FOUND");
  });

  it("409 ministério não deletado", async () => {
    const res = await request(app)
      .patch(`/ministries/${activeMinistryId}/restore`)
      .set("Cookie", presidentToken)
      .send({ reason: "motivo" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("MINISTRY_NOT_DELETED");
  });

  it("200 restaura ministério, audita e vínculos reaparecem", async () => {
    const res = await request(app)
      .patch(`/ministries/${deletedMinistryId}/restore`)
      .set("Cookie", presidentToken)
      .send({ reason: "reativação do ministério" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: deletedMinistryId });

    const ministry = await prisma.ministry.findUnique({ where: { id: deletedMinistryId } });
    expect(ministry!.deletedAt).toBeNull();

    const log = await prisma.ministryRestoreLog.findFirst({
      where: { ministryId: deletedMinistryId },
      orderBy: { createdAt: "desc" },
    });
    expect(log).not.toBeNull();
    expect(log!.restoredById).toBe(presidentId);
    expect(log!.reason).toBe("reativação do ministério");
    expect(log!.changes).toEqual({
      deletedAt: { before: "2026-08-01T10:00:00.000Z", after: null },
    });

    const detail = await request(app)
      .get(`/ministries/${deletedMinistryId}`)
      .set("Cookie", presidentToken);
    expect(detail.status).toBe(200);
    expect(detail.body.members).toHaveLength(1);
  });

  it("deletado some de GET /ministries e GET /ministries/:id → 404", async () => {
    await prisma.ministry.update({
      where: { id: activeMinistryId },
      data: { deletedAt: new Date() },
    });

    const listRes = await request(app)
      .get("/ministries")
      .set("Cookie", presidentToken);
    expect(listRes.status).toBe(200);
    expect(listRes.body.some((m: { id: string }) => m.id === activeMinistryId)).toBe(false);

    const getRes = await request(app)
      .get(`/ministries/${activeMinistryId}`)
      .set("Cookie", presidentToken);
    expect(getRes.status).toBe(404);

    const updateRes = await request(app)
      .patch(`/ministries/${activeMinistryId}`)
      .set("Cookie", presidentToken)
      .send({ name: "Nope" });
    expect(updateRes.status).toBe(404);
  });

  it("restore de ministério deletado via API torna-o visível e auditável novamente", async () => {
    await prisma.ministry.update({
      where: { id: activeMinistryId },
      data: { deletedAt: null },
    });

    const res = await request(app)
      .patch(`/ministries/${activeMinistryId}/restore`)
      .set("Cookie", presidentToken)
      .send({ reason: "volta da aposentadoria" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("MINISTRY_NOT_DELETED");
  });

  it("restore após restore → 409 MINISTRY_NOT_DELETED (idempotência via estado)", async () => {
    const res = await request(app)
      .patch(`/ministries/${deletedMinistryId}/restore`)
      .set("Cookie", presidentToken)
      .send({ reason: "segunda tentativa" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("MINISTRY_NOT_DELETED");

    const logs = await prisma.ministryRestoreLog.count({ where: { ministryId: deletedMinistryId } });
    expect(logs).toBe(1);
  });

  it("nome continua reservado após restore e durante todo o lifecycle", async () => {
    const res = await request(app)
      .post("/ministries")
      .set("Cookie", presidentToken)
      .send({ name: "Deleted Ministry" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("MINISTRY_NAME_CONFLICT");
  });

  it("concorrência restore × delete compartilham a mesma critical section", async () => {
    await prisma.ministry.update({
      where: { id: concurrencyMinistryId },
      data: { deletedAt: new Date() },
    });

    const [restoreResult, deleteResult] = await Promise.allSettled([
      request(app)
        .patch(`/ministries/${concurrencyMinistryId}/restore`)
        .set("Cookie", presidentToken)
        .send({ reason: "concurrency restore" }),
      request(app)
        .patch(`/ministries/${concurrencyMinistryId}/delete`)
        .set("Cookie", presidentToken),
    ]);

    expect(restoreResult.status).toBe("fulfilled");
    if (restoreResult.status === "fulfilled") {
      expect(restoreResult.value.status).toBe(200);
    }
    expect(deleteResult.status).toBe("fulfilled");
    if (deleteResult.status === "fulfilled") {
      expect(deleteResult.value.status).toBe(204);
    }

    const logs = await prisma.ministryRestoreLog.count({ where: { ministryId: concurrencyMinistryId } });
    expect(logs).toBe(1);
  });
});