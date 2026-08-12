import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../../../../app";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase } from "../../../../__tests__/helpers";

const jwt = new JwtProvider();

function authCookie(userId: string, level: number) {
  return `accessToken=${jwt.signAccessToken({ userId, userLevel: level, sessionId: "s" })}`;
}

describe("0H.2A — Event create & close", () => {
  let prisma: PrismaClient;
  let leaderToken: string;
  let memberToken: string;
  const leaderId = "u-ev-leader";
  const memberId = "u-ev-member";

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-ev-leader", name: "MINISTRY_LEADER", level: 40 },
        { id: "r-ev-member", name: "MEMBER", level: 10 },
        { id: "r-ev-admin", name: "TREASURER", level: 80 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: leaderId, email: "ev-leader@test.com", passwordHash: "h", isActive: true },
        { id: memberId, email: "ev-member@test.com", passwordHash: "h", isActive: true },
        { id: "u-ev-admin-1", email: "ev-admin1@test.com", passwordHash: "h", isActive: true },
        { id: "u-ev-admin-2", email: "ev-admin2@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: leaderId, roleId: "r-ev-leader" },
        { userId: memberId, roleId: "r-ev-member" },
        { userId: "u-ev-admin-1", roleId: "r-ev-admin" },
        { userId: "u-ev-admin-2", roleId: "r-ev-admin" },
      ],
    });

    await prisma.member.create({
      data: {
        id: "m-ev-preacher",
        fullName: "Preacher One",
        normalizedFullName: "preacher one",
        birthDate: new Date("1990-01-01"),
        churchJoinDate: new Date("2020-01-01"),
      },
    });

    await prisma.category.createMany({
      data: [
        { id: "c-ev-income", name: "Dízimo", type: "INCOME" },
        { id: "c-ev-expense", name: "Despesa", type: "EXPENSE" },
      ],
    });

    leaderToken = authCookie(leaderId, 40);
    memberToken = authCookie(memberId, 10);
  });

  afterAll(async () => {
    await cleanIntegrationDatabase(prisma);
    await prisma.$disconnect();
  });

  it("POST /events (without endsAt) → 201, creates SCHEDULED event", async () => {
    const res = await request(app)
      .post("/events")
      .set("Cookie", leaderToken)
      .send({
        event: {
          type: "SUNDAY_SERVICE",
          startsAt: new Date("2026-08-02T08:00:00Z").toISOString(),
          title: "SCHEDULED Test",
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();

    const event = await prisma.event.findUnique({ where: { id: res.body.id } });
    expect(event).not.toBeNull();
    expect(event!.status).toBe("SCHEDULED");
    expect(event!.title).toBe("SCHEDULED Test");
    expect(event!.preacherId).toBeNull();
    expect(event!.theme).toBeNull();
    expect(event!.notes).toBeNull();
  });

  it("POST /events (with endsAt) → 201, creates FINISHED event", async () => {
    const res = await request(app)
      .post("/events")
      .set("Cookie", leaderToken)
      .send({
        event: {
          type: "SUNDAY_SERVICE",
          startsAt: new Date("2026-08-02T08:00:00Z").toISOString(),
          endsAt: new Date("2026-08-02T10:00:00Z").toISOString(),
          title: "Finished Test",
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();

    const event = await prisma.event.findUnique({ where: { id: res.body.id } });
    expect(event).not.toBeNull();
    expect(event!.status).toBe("FINISHED");
    expect(event!.endsAt).toBeDefined();
  });

  it("POST /events with attendance → 201, creates EventAttendance", async () => {
    const res = await request(app)
      .post("/events")
      .set("Cookie", leaderToken)
      .send({
        event: {
          type: "SUNDAY_SERVICE",
          startsAt: new Date("2026-08-09T08:00:00Z").toISOString(),
          endsAt: new Date("2026-08-09T10:00:00Z").toISOString(),
          title: "With Attendance",
        },
        attendance: { membersCount: 50, visitorsCount: 10 },
      });

    expect(res.status).toBe(201);

    const attendance = await prisma.eventAttendance.findUnique({
      where: { eventId: res.body.id },
    });
    expect(attendance).not.toBeNull();
    expect(attendance!.membersCount).toBe(50);
    expect(attendance!.visitorsCount).toBe(10);
  });

  it("POST /events with financial records → 201, creates records in same transaction", async () => {
    const res = await request(app)
      .post("/events")
      .set("Cookie", leaderToken)
      .send({
        event: {
          type: "SUNDAY_SERVICE",
          startsAt: new Date("2026-08-16T08:00:00Z").toISOString(),
          endsAt: new Date("2026-08-16T10:00:00Z").toISOString(),
          title: "With Finance",
        },
        attendance: { membersCount: 30, visitorsCount: 5 },
        financialRecords: [
          { amount: 500, method: "PIX", date: new Date().toISOString(), categoryId: "c-ev-income", recordedById: leaderId, description: "Dízimo" },
          { amount: 200, method: "CASH", date: new Date().toISOString(), categoryId: "c-ev-expense", recordedById: leaderId, description: "Som" },
        ],
      });

    expect(res.status).toBe(201);

    const records = await prisma.financialRecord.findMany({
      where: { eventId: res.body.id },
    });
    expect(records).toHaveLength(2);
    expect(records.some(r => r.amount.toString() === "500")).toBe(true);
    expect(records.some(r => r.amount.toString() === "200")).toBe(true);
  });

  it("POST /events with invalid category → 404, rollback entire transaction", async () => {
    const res = await request(app)
      .post("/events")
      .set("Cookie", leaderToken)
      .send({
        event: {
          type: "SUNDAY_SERVICE",
          startsAt: new Date("2026-08-23T08:00:00Z").toISOString(),
          endsAt: new Date("2026-08-23T10:00:00Z").toISOString(),
          title: "Rollback Test",
        },
        financialRecords: [
          { amount: 100, method: "PIX", date: new Date().toISOString(), categoryId: "nonexistent-category", recordedById: leaderId },
        ],
      });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("CATEGORY_NOT_FOUND");

    const event = await prisma.event.findFirst({ where: { title: "Rollback Test" } });
    expect(event).toBeNull();
  });

  it("POST /events with existing SCHEDULED event.id → finishes it (CAS)", async () => {
    // First create a SCHEDULED event
    const created = await request(app)
      .post("/events")
      .set("Cookie", leaderToken)
      .send({
        event: {
          type: "PRAYER_MEETING",
          startsAt: new Date("2026-08-30T19:00:00Z").toISOString(),
          title: "To Be Finished",
        },
      });
    expect(created.status).toBe(201);

    const eventId = created.body.id;

    // Now finish it by posting with the event.id
    const finished = await request(app)
      .post("/events")
      .set("Cookie", leaderToken)
      .send({
        event: {
          id: eventId,
          type: "PRAYER_MEETING",
          startsAt: new Date("2026-08-30T19:00:00Z").toISOString(),
          endsAt: new Date("2026-08-30T21:00:00Z").toISOString(),
          title: "To Be Finished",
        },
      });

    expect(finished.status).toBe(201);

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    expect(event!.status).toBe("FINISHED");
  });

  it("POST /events with same SCHEDULED event.id twice → second returns 409", async () => {
    const created = await request(app)
      .post("/events")
      .set("Cookie", leaderToken)
      .send({
        event: {
          type: "BIBLE_STUDY",
          startsAt: new Date("2026-09-03T19:00:00Z").toISOString(),
          title: "Double Finish",
        },
      });
    expect(created.status).toBe(201);

    const eventId = created.body.id;

    await request(app)
      .post("/events")
      .set("Cookie", leaderToken)
      .send({
        event: {
          id: eventId,
          type: "BIBLE_STUDY",
          startsAt: new Date("2026-09-03T19:00:00Z").toISOString(),
          endsAt: new Date("2026-09-03T21:00:00Z").toISOString(),
          title: "Double Finish",
        },
      });

    const second = await request(app)
      .post("/events")
      .set("Cookie", leaderToken)
      .send({
        event: {
          id: eventId,
          type: "BIBLE_STUDY",
          startsAt: new Date("2026-09-03T19:00:00Z").toISOString(),
          endsAt: new Date("2026-09-03T21:00:00Z").toISOString(),
          title: "Double Finish",
        },
      });

    expect(second.status).toBe(409);
    expect(second.body.code).toBe("EVENT_ALREADY_FINISHED");
  });

  it("POST /events with non-existent event.id → 404", async () => {
    const res = await request(app)
      .post("/events")
      .set("Cookie", leaderToken)
      .send({
        event: {
          id: "nonexistent-event-id",
          type: "SUNDAY_SERVICE",
          startsAt: new Date("2026-09-10T08:00:00Z").toISOString(),
          endsAt: new Date("2026-09-10T10:00:00Z").toISOString(),
          title: "Non Existent",
        },
      });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("EVENT_NOT_FOUND");
  });

  it("POST /events without auth → 401", async () => {
    const res = await request(app)
      .post("/events")
      .send({ event: { type: "SUNDAY_SERVICE", startsAt: new Date().toISOString(), title: "No Auth" } });
    expect(res.status).toBe(401);
  });

  it("POST /events with MEMBER token → 403", async () => {
    const res = await request(app)
      .post("/events")
      .set("Cookie", memberToken)
      .send({ event: { type: "SUNDAY_SERVICE", startsAt: new Date().toISOString(), title: "No Permission" } });
    expect(res.status).toBe(403);
  });
});
