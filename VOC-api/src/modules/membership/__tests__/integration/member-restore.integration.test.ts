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

describe("0I.4 — PATCH /members/:memberId/restore", () => {
  let prisma: PrismaClient;
  const presidentId = "u-rest-pres";
  const memberUserId = "u-rest-member";
  const presidentToken = authCookie(presidentId, 100);
  const memberToken = authCookie(memberUserId, 10);

  const deletedMemberId = generateId();
  const inactiveDeletedMemberId = generateId();
  const activeMemberId = generateId();
  const nonexistentMemberId = generateId();
  const concurrencyMemberId = generateId();

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
        { id: "u-rest-linked", email: "rest-linked@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: presidentId, roleId: "r-rest-pres" },
        { userId: memberUserId, roleId: "r-rest-member" },
        { userId: "u-rest-linked", roleId: "r-rest-member" },
      ],
    });

    const deletedAt = new Date("2026-08-01T10:00:00Z");
    await prisma.member.createMany({
      data: [
        { id: deletedMemberId, fullName: "Deleted Member", normalizedFullName: "deleted member", birthDate: new Date("1990-06-15"), churchJoinDate: new Date("2020-01-10"), status: "ACTIVE", deletedAt },
        { id: inactiveDeletedMemberId, fullName: "Inactive Deleted Member", normalizedFullName: "inactive deleted member", birthDate: new Date("1985-02-20"), churchJoinDate: new Date("2019-05-05"), status: "INACTIVE", userId: "u-rest-linked", deletedAt },
        { id: activeMemberId, fullName: "Active Member", normalizedFullName: "active member", birthDate: new Date("1995-11-03"), churchJoinDate: new Date("2021-03-15"), status: "ACTIVE" },
        { id: concurrencyMemberId, fullName: "Concurrency Member", normalizedFullName: "concurrency member", birthDate: new Date("1988-09-09"), churchJoinDate: new Date("2018-01-01"), status: "ACTIVE", deletedAt },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("401 sem auth", async () => {
    const res = await request(app)
      .patch(`/members/${deletedMemberId}/restore`)
      .send({ reason: "motivo" });

    expect(res.status).toBe(401);
  });

  it("403 abaixo de PRESIDENT", async () => {
    const res = await request(app)
      .patch(`/members/${deletedMemberId}/restore`)
      .set("Cookie", memberToken)
      .send({ reason: "motivo" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("INSUFFICIENT_PERMISSION_LEVEL");
  });

  it("422 reason ausente", async () => {
    const res = await request(app)
      .patch(`/members/${deletedMemberId}/restore`)
      .set("Cookie", presidentToken)
      .send({});

    expect(res.status).toBe(422);
  });

  it("422 reason curto", async () => {
    const res = await request(app)
      .patch(`/members/${deletedMemberId}/restore`)
      .set("Cookie", presidentToken)
      .send({ reason: "ab" });

    expect(res.status).toBe(422);
  });

  it("404 membro inexistente", async () => {
    const res = await request(app)
      .patch(`/members/${nonexistentMemberId}/restore`)
      .set("Cookie", presidentToken)
      .send({ reason: "motivo" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("MEMBER_NOT_FOUND");
  });

  it("409 membro não deletado", async () => {
    const res = await request(app)
      .patch(`/members/${activeMemberId}/restore`)
      .set("Cookie", presidentToken)
      .send({ reason: "motivo" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("MEMBER_NOT_DELETED");
  });

  it("200 restaura membro deletado e audita antes/depois", async () => {
    const res = await request(app)
      .patch(`/members/${deletedMemberId}/restore`)
      .set("Cookie", presidentToken)
      .send({ reason: "volta a frequentar" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: deletedMemberId });

    const member = await prisma.member.findUnique({ where: { id: deletedMemberId } });
    expect(member!.deletedAt).toBeNull();

    const log = await prisma.memberRestoreLog.findFirst({
      where: { memberId: deletedMemberId },
      orderBy: { createdAt: "desc" },
    });
    expect(log).not.toBeNull();
    expect(log!.restoredById).toBe(presidentId);
    expect(log!.reason).toBe("volta a frequentar");
    expect(log!.changes).toEqual({
      deletedAt: { before: "2026-08-01T10:00:00.000Z", after: null },
    });
  });

  it("preserva status, userId e não gera Notification", async () => {
    const notificationsBefore = await prisma.notification.count();

    const res = await request(app)
      .patch(`/members/${inactiveDeletedMemberId}/restore`)
      .set("Cookie", presidentToken)
      .send({ reason: "reativação recebida" });

    expect(res.status).toBe(200);

    const member = await prisma.member.findUnique({ where: { id: inactiveDeletedMemberId } });
    expect(member!.deletedAt).toBeNull();
    expect(member!.status).toBe("INACTIVE");
    expect(member!.userId).toBe("u-rest-linked");

    const log = await prisma.memberRestoreLog.findFirst({
      where: { memberId: inactiveDeletedMemberId },
      orderBy: { createdAt: "desc" },
    });
    expect(log!.changes).toEqual({
      deletedAt: { before: "2026-08-01T10:00:00.000Z", after: null },
    });

    const notificationsAfter = await prisma.notification.count();
    expect(notificationsAfter).toBe(notificationsBefore);
  });

  it("restore após restore → 409 MEMBER_NOT_DELETED (idempotência via estado)", async () => {
    const res = await request(app)
      .patch(`/members/${deletedMemberId}/restore`)
      .set("Cookie", presidentToken)
      .send({ reason: "segunda tentativa" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("MEMBER_NOT_DELETED");

    const logs = await prisma.memberRestoreLog.count({ where: { memberId: deletedMemberId } });
    expect(logs).toBe(1);
  });

  it("concorrência restore × delete compartilham a mesma critical section", async () => {
    await prisma.member.update({
      where: { id: concurrencyMemberId },
      data: { deletedAt: new Date() },
    });

    const [restoreResult, deleteResult] = await Promise.allSettled([
      request(app)
        .patch(`/members/${concurrencyMemberId}/restore`)
        .set("Cookie", presidentToken)
        .send({ reason: "concurrency restore" }),
      request(app)
        .patch(`/members/${concurrencyMemberId}/delete`)
        .set("Cookie", presidentToken),
    ]);

    // O lock serializa: restore observa o membro deletado e audita exatamente 1 registro.
    // O delete roda depois e, tendo o restore vencido, deleta novamente — nunca há log órfão.
    expect(restoreResult.status).toBe("fulfilled");
    if (restoreResult.status === "fulfilled") {
      expect(restoreResult.value.status).toBe(200);
    }
    expect(deleteResult.status).toBe("fulfilled");
    if (deleteResult.status === "fulfilled") {
      expect(deleteResult.value.status).toBe(204);
    }

    const logs = await prisma.memberRestoreLog.count({ where: { memberId: concurrencyMemberId } });
    expect(logs).toBe(1);
  });
});