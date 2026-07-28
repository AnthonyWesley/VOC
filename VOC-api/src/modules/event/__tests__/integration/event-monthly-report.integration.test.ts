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

describe("0H.2C.2 — Monthly report", () => {
  let prisma: PrismaClient;
  let token: string;

  const userId = "u-report-test";
  const memberId = generateId();

  const eventIds = {
    summaryAug1: generateId(),
    summaryAug2: generateId(),
    summaryNoAttendance: generateId(),
    individualAug1: generateId(),
    individualAug2: generateId(),
    individualNoParticipants: generateId(),
    cancelled: generateId(),
    deleted: generateId(),
    differentMonth: generateId(),
    differentType: generateId(),
  };

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    // Set timezone
    await prisma.siteContentSettings.upsert({
      where: { id: "main" },
      create: { id: "main", timezone: "America/Sao_Paulo" },
      update: { timezone: "America/Sao_Paulo" },
    });

    await prisma.role.createMany({
      data: [{ id: "r-report-test", name: "TREASURER", level: 80 }],
    });

    await prisma.user.create({
      data: { id: userId, email: "report-test@test.com", passwordHash: "h", isActive: true },
    });

    await prisma.userRole.create({
      data: { userId, roleId: "r-report-test" },
    });

    const now = new Date();
    const otherMemberId1 = generateId();
    const otherMemberId2 = generateId();
    const otherMemberId3 = generateId();
    await prisma.member.createMany({
      data: [
        { id: memberId, fullName: "Report Member", normalizedFullName: "report member", birthDate: now, churchJoinDate: now },
        { id: otherMemberId1, fullName: "Other Member 1", normalizedFullName: "other member 1", birthDate: now, churchJoinDate: now },
        { id: otherMemberId2, fullName: "Other Member 2", normalizedFullName: "other member 2", birthDate: now, churchJoinDate: now },
        { id: otherMemberId3, fullName: "Other Member 3", normalizedFullName: "other member 3", birthDate: now, churchJoinDate: now },
      ],
    });

    // SUMMARY events with attendance
    await prisma.event.create({
      data: {
        id: eventIds.summaryAug1,
        type: "SUNDAY_SERVICE",
        status: "SCHEDULED",
        startsAt: new Date("2026-08-15T10:00:00Z"),
        attendanceMode: "SUMMARY",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await prisma.eventAttendance.create({
      data: { id: generateId(), eventId: eventIds.summaryAug1, membersCount: 30, visitorsCount: 5 },
    });

    await prisma.event.create({
      data: {
        id: eventIds.summaryAug2,
        type: "SUNDAY_SERVICE",
        status: "SCHEDULED",
        startsAt: new Date("2026-08-10T10:00:00Z"),
        attendanceMode: "SUMMARY",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await prisma.eventAttendance.create({
      data: { id: generateId(), eventId: eventIds.summaryAug2, membersCount: 20, visitorsCount: 3 },
    });

    // SUMMARY event without attendance (should be included with 0)
    await prisma.event.create({
      data: {
        id: eventIds.summaryNoAttendance,
        type: "SUNDAY_SERVICE",
        status: "SCHEDULED",
        startsAt: new Date("2026-08-05T10:00:00Z"),
        attendanceMode: "SUMMARY",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // INDIVIDUAL events with participants
    await prisma.event.create({
      data: {
        id: eventIds.individualAug1,
        type: "HOUSE_SERVICE",
        status: "SCHEDULED",
        startsAt: new Date("2026-08-12T10:00:00Z"),
        attendanceMode: "INDIVIDUAL",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await prisma.eventMember.createMany({
      data: [
        { eventId: eventIds.individualAug1, memberId, joinedAt: now, participantType: "MEMBER" },
        { eventId: eventIds.individualAug1, memberId: otherMemberId1, joinedAt: now, participantType: "MEMBER" },
        { eventId: eventIds.individualAug1, memberId: otherMemberId2, joinedAt: now, participantType: "VISITOR" },
      ],
    });

    await prisma.event.create({
      data: {
        id: eventIds.individualAug2,
        type: "HOUSE_SERVICE",
        status: "SCHEDULED",
        startsAt: new Date("2026-08-08T10:00:00Z"),
        attendanceMode: "INDIVIDUAL",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await prisma.eventMember.createMany({
      data: [
        { eventId: eventIds.individualAug2, memberId, joinedAt: now, participantType: "MEMBER" },
        { eventId: eventIds.individualAug2, memberId: otherMemberId3, joinedAt: now, participantType: "VISITOR" },
      ],
    });

    // INDIVIDUAL event without participants (0 count)
    await prisma.event.create({
      data: {
        id: eventIds.individualNoParticipants,
        type: "HOUSE_SERVICE",
        status: "SCHEDULED",
        startsAt: new Date("2026-08-03T10:00:00Z"),
        attendanceMode: "INDIVIDUAL",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Cancelled SUNDAY_SERVICE in August
    await prisma.event.create({
      data: {
        id: eventIds.cancelled,
        type: "SUNDAY_SERVICE",
        status: "CANCELLED",
        startsAt: new Date("2026-08-01T10:00:00Z"),
        attendanceMode: "SUMMARY",
        createdAt: new Date(),
        updatedAt: new Date(),
        cancelledAt: new Date(),
        cancelledById: userId,
        cancelReason: "test",
      },
    });

    // Deleted event (should not appear anywhere)
    await prisma.event.create({
      data: {
        id: eventIds.deleted,
        type: "SUNDAY_SERVICE",
        status: "SCHEDULED",
        startsAt: new Date("2026-08-20T10:00:00Z"),
        attendanceMode: "SUMMARY",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
        deletedById: userId,
        deleteReason: "test",
      },
    });

    // Event in September (different month)
    await prisma.event.create({
      data: {
        id: eventIds.differentMonth,
        type: "SUNDAY_SERVICE",
        status: "SCHEDULED",
        startsAt: new Date("2026-09-15T10:00:00Z"),
        attendanceMode: "SUMMARY",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // BIBLE_STUDY in August (different type)
    await prisma.event.create({
      data: {
        id: eventIds.differentType,
        type: "BIBLE_STUDY",
        status: "SCHEDULED",
        startsAt: new Date("2026-08-18T10:00:00Z"),
        attendanceMode: "SUMMARY",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    token = authCookie(userId, 80);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─── HTTP VALIDATION ───────────────────────────────────────────

  describe("HTTP validation", () => {
    it("no params → 200, returns report shape", async () => {
      const res = await request(app).get("/events/monthly-report").set("Cookie", token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("month");
      expect(res.body).toHaveProperty("year");
      expect(res.body).toHaveProperty("events");
      expect(res.body).toHaveProperty("summary");
      expect(res.body).toHaveProperty("individual");
      expect(res.body).toHaveProperty("cancelledEvents");
    });

    it("month=0 → 422", async () => {
      const res = await request(app).get("/events/monthly-report?month=0").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("month=13 → 422", async () => {
      const res = await request(app).get("/events/monthly-report?month=13").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("month=abc → 422", async () => {
      const res = await request(app).get("/events/monthly-report?month=abc").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("year=abc → 422", async () => {
      const res = await request(app).get("/events/monthly-report?year=abc").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("type=INVALID → 422", async () => {
      const res = await request(app).get("/events/monthly-report?type=INVALID").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("unauthorized → 401", async () => {
      const res = await request(app).get("/events/monthly-report");
      expect(res.status).toBe(401);
    });

    it("MEMBER level → 403", async () => {
      const memberToken = authCookie(userId, 10);
      const res = await request(app).get("/events/monthly-report").set("Cookie", memberToken);
      expect(res.status).toBe(403);
    });
  });

  // ─── SUMMARY AGGREGATION ───────────────────────────────────────

  describe("SUMMARY aggregation", () => {
    it("reports totals and averages", async () => {
      const res = await request(app).get("/events/monthly-report?month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);

      // 4 SUMMARY events (Aug 15, Aug 10, Aug 5 without attendance, Aug 18 BIBLE_STUDY)
      expect(res.body.summary.totalEvents).toBe(4);
      expect(res.body.summary.totalMembers).toBe(50); // 30 + 20 + 0
      expect(res.body.summary.totalVisitors).toBe(8); // 5 + 3 + 0
      expect(res.body.summary.averageMembers).toBeCloseTo(12.5, 1); // 50/4
    });

    it("SUMMARY event without attendance contributes 0", async () => {
      const res = await request(app).get("/events/monthly-report?month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      const noAtt = res.body.events.find((e: any) => e.id === eventIds.summaryNoAttendance);
      expect(noAtt).toBeDefined();
      expect(noAtt.membersCount).toBe(0);
      expect(noAtt.visitorsCount).toBe(0);
    });
  });

  // ─── INDIVIDUAL AGGREGATION ────────────────────────────────────

  describe("INDIVIDUAL aggregation", () => {
    it("reports totals and averages", async () => {
      const res = await request(app).get("/events/monthly-report?month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);

      // 3 INDIVIDUAL events
      expect(res.body.individual.events).toBe(3);
      // Event 1: 2 MEMBER + 1 VISITOR = 3
      // Event 2: 1 MEMBER + 1 VISITOR = 2
      // Event 3: 0 MEMBER + 0 VISITOR = 0
      expect(res.body.individual.membersPresent).toBe(3); // 2 + 1 + 0
      expect(res.body.individual.visitorsPresent).toBe(2); // 1 + 1 + 0
    });
  });

  // ─── MIXED MODES ───────────────────────────────────────────────

  describe("Mixed modes", () => {
    it("SUMMARY and INDIVIDUAL counts are separate", async () => {
      const res = await request(app).get("/events/monthly-report?month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);

      // Total events in events[] = 3 SUMMARY + 3 INDIVIDUAL = 9 (including cancelled? No)
      // Wait: events array should have all non-cancelled:
      // 3 SUMMARY + 3 INDIVIDUAL + 1 BIBLE_STUDY (SUMMARY) = 7 events
      expect(res.body.events.length).toBe(7);

      const summaryEvents = res.body.events.filter((e: any) => e.attendanceMode === "SUMMARY");
      const individualEvents = res.body.events.filter((e: any) => e.attendanceMode === "INDIVIDUAL");
      expect(summaryEvents.length).toBe(4); // 3 SUNDAY_SERVICE + 1 BIBLE_STUDY
      expect(individualEvents.length).toBe(3);
    });

    it("averageMembers is null when no SUMMARY events", async () => {
      // September has 1 SUNDAY_SERVICE (SUMMARY)
      const res = await request(app).get("/events/monthly-report?month=9&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      expect(res.body.summary.totalEvents).toBe(1);
      expect(res.body.summary.averageMembers).not.toBeNull();
    });

    it("average is null when zero events of that mode", async () => {
      // No individual events in September
      const res = await request(app).get("/events/monthly-report?month=9&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      expect(res.body.individual.events).toBe(0);
      expect(res.body.individual.averageMembersPresent).toBeNull();
    });
  });

  // ─── CANCELLED + DELETED ──────────────────────────────────────

  describe("Cancelled and deleted", () => {
    it("cancelled event counted in cancelledEvents", async () => {
      const res = await request(app).get("/events/monthly-report?month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      expect(res.body.cancelledEvents).toBe(1);
    });

    it("cancelled event not in events array", async () => {
      const res = await request(app).get("/events/monthly-report?month=8&year=2026").set("Cookie", token);
      const ids = res.body.events.map((e: any) => e.id);
      expect(ids).not.toContain(eventIds.cancelled);
    });

    it("soft deleted event not in events, count, or cancelled", async () => {
      const res = await request(app).get("/events/monthly-report?month=8&year=2026").set("Cookie", token);
      const ids = res.body.events.map((e: any) => e.id);
      expect(ids).not.toContain(eventIds.deleted);
    });
  });

  // ─── TYPE FILTER ───────────────────────────────────────────────

  describe("Type filter", () => {
    it("filters events by type", async () => {
      const res = await request(app).get("/events/monthly-report?month=8&year=2026&type=SUNDAY_SERVICE").set("Cookie", token);
      expect(res.status).toBe(200);
      for (const e of res.body.events) {
        expect(e.type).toBe("SUNDAY_SERVICE");
      }
    });

    it("type filter applies to all aggregates", async () => {
      const res = await request(app).get("/events/monthly-report?month=8&year=2026&type=SUNDAY_SERVICE").set("Cookie", token);
      expect(res.status).toBe(200);
      // Only SUNDAY_SERVICE events
      expect(res.body.events.every((e: any) => e.type === "SUNDAY_SERVICE")).toBe(true);
      // BIBLE_STUDY should not appear
      const ids = res.body.events.map((e: any) => e.id);
      expect(ids).not.toContain(eventIds.differentType);
    });

    it("type filter covers cancelled events too", async () => {
      const res = await request(app).get("/events/monthly-report?month=8&year=2026&type=BIBLE_STUDY").set("Cookie", token);
      expect(res.status).toBe(200);
      expect(res.body.cancelledEvents).toBe(0); // no BIBLE_STUDY cancelled
    });

    it("empty results for type with no events", async () => {
      const res = await request(app).get("/events/monthly-report?month=8&year=2026&type=YOUTH_NIGHT").set("Cookie", token);
      expect(res.status).toBe(200);
      expect(res.body.events.length).toBe(0);
      expect(res.body.summary.totalEvents).toBe(0);
      expect(res.body.individual.events).toBe(0);
      expect(res.body.cancelledEvents).toBe(0);
    });
  });

  // ─── CALENDAR BOUNDARIES ──────────────────────────────────────

  describe("Calendar boundaries", () => {
    it("event at last instant of previous month excluded from current month", async () => {
      // Event at July 31 23:59:59 BRT (UTC-3) = Aug 1 02:59:59 UTC
      // This event is in July local time → should be EXCLUDED from August
      const id = generateId();
      await prisma.event.create({
        data: {
          id,
          type: "SUNDAY_SERVICE",
          status: "SCHEDULED",
          startsAt: new Date("2026-08-01T02:59:59Z"),
          attendanceMode: "SUMMARY",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await request(app).get("/events/monthly-report?month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      const ids = res.body.events.map((e: any) => e.id);
      expect(ids).not.toContain(id);
    });

    it("event at first instant of month is included", async () => {
      // Event at Aug 1 00:00 BRT = Aug 1 03:00 UTC
      const id = generateId();
      await prisma.event.create({
        data: {
          id,
          type: "SUNDAY_SERVICE",
          status: "SCHEDULED",
          startsAt: new Date("2026-08-01T03:00:00Z"),
          attendanceMode: "SUMMARY",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await request(app).get("/events/monthly-report?month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      const ids = res.body.events.map((e: any) => e.id);
      expect(ids).toContain(id);
    });

    it("event at last instant of month is included", async () => {
      // Event at Aug 31 23:59:59 BRT = Sep 1 02:59:59 UTC
      const id = generateId();
      await prisma.event.create({
        data: {
          id,
          type: "SUNDAY_SERVICE",
          status: "SCHEDULED",
          startsAt: new Date("2026-09-01T02:59:59Z"),
          attendanceMode: "SUMMARY",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await request(app).get("/events/monthly-report?month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      const ids = res.body.events.map((e: any) => e.id);
      expect(ids).toContain(id);
    });

    it("event at first instant of next month is excluded", async () => {
      // Event at Sep 1 00:00 BRT = Sep 1 03:00 UTC
      const id = generateId();
      await prisma.event.create({
        data: {
          id,
          type: "SUNDAY_SERVICE",
          status: "SCHEDULED",
          startsAt: new Date("2026-09-01T03:00:00Z"),
          attendanceMode: "SUMMARY",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await request(app).get("/events/monthly-report?month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      const ids = res.body.events.map((e: any) => e.id);
      expect(ids).not.toContain(id);
    });
  });
});
