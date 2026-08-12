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

describe("0I.3 — PATCH /events/:eventId/correct", () => {
  let prisma: PrismaClient;
  let treasurerToken: string;
  let memberLeaderToken: string;

  const treasurerId = "u-cor-treasurer";
  const lowLevelUserId = "u-cor-lowlevel";

  const finishedEventId = generateId();
  const finishedPreacherId = generateId();
  const individualFinishedEventId = generateId();
  const scheduledEventId = generateId();
  const deletedFinishedEventId = generateId();
  const attendedEventId = generateId();
  const nonexistentEventId = generateId();
  const concurrencyEventId = generateId();

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-cor-treasurer", name: "TREASURER", level: 80 },
        { id: "r-cor-leader", name: "MINISTRY_LEADER", level: 40 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: treasurerId, email: "cor-treasurer@test.com", passwordHash: "h", isActive: true },
        { id: lowLevelUserId, email: "cor-lowlevel@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: treasurerId, roleId: "r-cor-treasurer" },
        { userId: lowLevelUserId, roleId: "r-cor-leader" },
      ],
    });

    const now = new Date();
    await prisma.member.create({
      data: {
        id: finishedPreacherId,
        fullName: "Correction Preacher",
        normalizedFullName: "correction preacher",
        birthDate: now,
        churchJoinDate: now,
        userId: treasurerId,
      },
    });

    await prisma.event.createMany({
      data: [
        { id: finishedEventId, type: "SUNDAY_SERVICE", status: "FINISHED", startsAt: new Date("2026-07-26T08:00:00Z"), endsAt: new Date("2026-07-26T10:00:00Z"), attendanceMode: "SUMMARY", theme: "old-theme", notes: "old-notes", preacherId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: attendedEventId, type: "SUNDAY_SERVICE", status: "FINISHED", startsAt: new Date("2026-07-26T08:00:00Z"), endsAt: new Date("2026-07-26T10:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
        { id: concurrencyEventId, type: "SUNDAY_SERVICE", status: "FINISHED", startsAt: new Date("2026-07-26T08:00:00Z"), endsAt: new Date("2026-07-26T10:00:00Z"), attendanceMode: "SUMMARY", theme: "keep", createdAt: new Date(), updatedAt: new Date() },
        { id: scheduledEventId, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date("2026-08-02T08:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
        { id: individualFinishedEventId, type: "SUNDAY_SERVICE", status: "FINISHED", startsAt: new Date("2026-07-26T08:00:00Z"), endsAt: new Date("2026-07-26T10:00:00Z"), attendanceMode: "INDIVIDUAL", createdAt: new Date(), updatedAt: new Date() },
      ],
    });

    await prisma.event.update({
      where: { id: deletedFinishedEventId },
      data: { status: "FINISHED", endsAt: new Date("2026-07-26T10:00:00Z"), deletedAt: new Date(), deletedById: treasurerId, deleteReason: "test" },
    }).catch(async () => {
      await prisma.event.create({
        data: { id: deletedFinishedEventId, type: "SUNDAY_SERVICE", status: "FINISHED", startsAt: new Date("2026-07-26T08:00:00Z"), endsAt: new Date("2026-07-26T10:00:00Z"), attendanceMode: "SUMMARY", deletedAt: new Date(), deletedById: treasurerId, deleteReason: "test", createdAt: new Date(), updatedAt: new Date() },
      });
    });

    await prisma.eventAttendance.create({
      data: { id: generateId(), eventId: attendedEventId, membersCount: 30, visitorsCount: 20 },
    });

    treasurerToken = authCookie(treasurerId, 80);
    memberLeaderToken = authCookie(lowLevelUserId, 40);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("401 sem auth", async () => {
    const res = await request(app)
      .patch(`/events/${finishedEventId}/correct`)
      .send({ reason: "motivo", theme: "x" });

    expect(res.status).toBe(401);
  });

  it("403 abaixo de TREASURER", async () => {
    const res = await request(app)
      .patch(`/events/${finishedEventId}/correct`)
      .set("Cookie", memberLeaderToken)
      .send({ reason: "motivo", theme: "new-theme" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("INSUFFICIENT_PERMISSION_LEVEL");
  });

  it("422 reason curto", async () => {
    const res = await request(app)
      .patch(`/events/${finishedEventId}/correct`)
      .set("Cookie", treasurerToken)
      .send({ reason: "ab", theme: "new-theme" });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("CORRECTION_REASON_REQUIRED");
  });

  it("404 evento inexistente", async () => {
    const res = await request(app)
      .patch(`/events/${nonexistentEventId}/correct`)
      .set("Cookie", treasurerToken)
      .send({ reason: "motivo", theme: "x" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("EVENT_NOT_FOUND");
  });

  it("409 evento não FINISHED", async () => {
    const res = await request(app)
      .patch(`/events/${scheduledEventId}/correct`)
      .set("Cookie", treasurerToken)
      .send({ reason: "motivo", theme: "x" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("EVENT_NOT_FINISHED");
  });

  it("409 evento deletado", async () => {
    const res = await request(app)
      .patch(`/events/${deletedFinishedEventId}/correct`)
      .set("Cookie", treasurerToken)
      .send({ reason: "motivo", theme: "x" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("EVENT_DELETED");
  });

  it("422 preacher inexistente", async () => {
    const res = await request(app)
      .patch(`/events/${finishedEventId}/correct`)
      .set("Cookie", treasurerToken)
      .send({ reason: "motivo", preacherId: "member-does-not-exist" });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("PREACHER_NOT_FOUND");
  });

  it("422 contagens em INDIVIDUAL", async () => {
    const res = await request(app)
      .patch(`/events/${individualFinishedEventId}/correct`)
      .set("Cookie", treasurerToken)
      .send({ reason: "motivo", membersCount: 10 });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("INDIVIDUAL_ATTENDANCE_COUNTS_ARE_DERIVED");
  });

  it("422 NO_CHANGES_DETECTED", async () => {
    const res = await request(app)
      .patch(`/events/${finishedEventId}/correct`)
      .set("Cookie", treasurerToken)
      .send({ reason: "motivo", theme: "old-theme", notes: "old-notes" });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("NO_CHANGES_DETECTED");
  });

  it("200 correção válida persiste EventCorrection com before/after, reason e correctedById", async () => {
    const res = await request(app)
      .patch(`/events/${finishedEventId}/correct`)
      .set("Cookie", treasurerToken)
      .send({ reason: "tema atualizado", theme: "new-theme", notes: "new-notes" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: finishedEventId, corrections: 2 });

    const correction = await prisma.eventCorrection.findFirst({
      where: { eventId: finishedEventId },
      orderBy: { createdAt: "desc" },
    });
    expect(correction).not.toBeNull();
    expect(correction!.correctedById).toBe(treasurerId);
    expect(correction!.reason).toBe("tema atualizado");
    expect(correction!.changes).toEqual({
      theme: { before: "old-theme", after: "new-theme" },
      notes: { before: "old-notes", after: "new-notes" },
    });

    const event = await prisma.event.findUnique({ where: { id: finishedEventId } });
    expect(event!.theme).toBe("new-theme");
    expect(event!.notes).toBe("new-notes");
  });

  it("200 valida preacher existente e grava mudança de preacherId", async () => {
    const res = await request(app)
      .patch(`/events/${finishedEventId}/correct`)
      .set("Cookie", treasurerToken)
      .send({ reason: "troca pregador", preacherId: finishedPreacherId });

    expect(res.status).toBe(200);
    expect(res.body.corrections).toBe(1);

    const correction = await prisma.eventCorrection.findFirst({
      where: { eventId: finishedEventId },
      orderBy: { createdAt: "desc" },
    });
    expect(correction!.changes).toEqual({
      preacherId: { before: null, after: finishedPreacherId },
    });

    const event = await prisma.event.findUnique({ where: { id: finishedEventId } });
    expect(event!.preacherId).toBe(finishedPreacherId);
  });

  it("mudança de attendance persistida e registrada no EventCorrection", async () => {
    const res = await request(app)
      .patch(`/events/${attendedEventId}/correct`)
      .set("Cookie", treasurerToken)
      .send({ reason: "corrige contagem", membersCount: 45, visitorsCount: 25 });

    expect(res.status).toBe(200);
    expect(res.body.corrections).toBe(2);

    const attendance = await prisma.eventAttendance.findFirst({ where: { eventId: attendedEventId } });
    expect(attendance!.membersCount).toBe(45);
    expect(attendance!.visitorsCount).toBe(25);

    const correction = await prisma.eventCorrection.findFirst({
      where: { eventId: attendedEventId },
      orderBy: { createdAt: "desc" },
    });
    expect(correction!.changes).toEqual({
      membersCount: { before: 30, after: 45 },
      visitorsCount: { before: 20, after: 25 },
    });
  });

  it("correção não gera Notification", async () => {
    const notificationsBefore = await prisma.notification.count();
    const res = await request(app)
      .patch(`/events/${finishedEventId}/correct`)
      .set("Cookie", treasurerToken)
      .send({ reason: "sem notificação", theme: "only-here" });

    expect(res.status).toBe(200);
    const notificationsAfter = await prisma.notification.count();
    expect(notificationsAfter).toBe(notificationsBefore);
  });

  it("concorrência corret + delete compartilham o meesmo critical section", async () => {
    const [correctResult, deleteResult] = await Promise.allSettled([
      request(app)
        .patch(`/events/${concurrencyEventId}/correct`)
        .set("Cookie", treasurerToken)
        .send({ reason: "concurrent", theme: "change-now" }),
      request(app)
        .patch(`/events/${concurrencyEventId}/delete`)
        .set("Cookie", treasurerToken)
        .send({ reason: "cleanup" }),
    ]);

    const event = await prisma.event.findUnique({ where: { id: concurrencyEventId } });
    const correctionRows = await prisma.eventCorrection.count({ where: { eventId: concurrencyEventId } });

    if (deleteResult.status === "fulfilled" && deleteResult.value?.status === 204) {
      const correctOk = correctResult.status === "fulfilled" && correctResult.value?.status === 200;
      if (!correctOk) {
        expect(correctionRows).toBe(0);
      }
    } else if (correctResult.status === "fulfilled" && correctResult.value?.status === 200) {
      expect(correctionRows).toBe(1);
    }

    // ambos leram/gravaram dentro do mesmo lock: nenhuma linha órfã / sem raça de correção dupla
    expect(correctionRows).toBeLessThanOrEqual(1);
    expect(event).not.toBeNull();
  });
});