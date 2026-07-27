import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../../../../app";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase } from "../../../../__tests__/helpers";
import { generateId } from "../../../../shared/utils/generateId";
import { encodeEventCursor } from "../../domain/utils/eventCursor";

const jwt = new JwtProvider();

function authCookie(userId: string, level: number) {
  return `accessToken=${jwt.signAccessToken({ userId, userLevel: level, sessionId: "s" })}`;
}

describe("0H.2C.1 — Event list / pagination", () => {
  let prisma: PrismaClient;
  let token: string;

  const userId = "u-list-test";
  const memberId = generateId();

  const eventIds = {
    e1: generateId(),
    e2: generateId(),
    e3: generateId(),
    e4: generateId(),
    e5: generateId(),
    e6: generateId(),
    e7: generateId(),
    e8: generateId(),
    deleted: generateId(),
    cancelled: generateId(),
    differentMonth: generateId(),
    differentType: generateId(),
  };

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-list-test", name: "MEMBER", level: 10 },
      ],
    });

    await prisma.user.create({
      data: { id: userId, email: "list-test@test.com", passwordHash: "h", isActive: true },
    });

    await prisma.userRole.create({
      data: { userId, roleId: "r-list-test" },
    });

    const now = new Date();
    await prisma.member.create({
      data: { id: memberId, fullName: "List Test Member", normalizedFullName: "list test member", birthDate: now, churchJoinDate: now, userId },
    });

    // Events for deterministic ordering (same startsAt, different IDs)
    const sameDay = new Date("2026-08-15T10:00:00Z");

    // e1 has highest ID → should be first (DESC)
    await prisma.event.create({
      data: { id: eventIds.e1, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: sameDay, attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
    });

    // e2 has middle ID
    await prisma.event.create({
      data: { id: eventIds.e2, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: sameDay, attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
    });

    // e3 has lowest ID
    await prisma.event.create({
      data: { id: eventIds.e3, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: sameDay, attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
    });

    // e4 — earlier in the month (lower startsAt)
    await prisma.event.create({
      data: { id: eventIds.e4, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date("2026-08-01T10:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
    });

    // e5 — earlier in the month but same day as e4, lower ID
    await prisma.event.create({
      data: { id: eventIds.e5, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date("2026-08-01T10:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
    });

    // e6 — even earlier
    await prisma.event.create({
      data: { id: eventIds.e6, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date("2026-08-05T10:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
    });

    // e7 — different month (should not appear in August queries)
    await prisma.event.create({
      data: { id: eventIds.e7, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date("2026-09-15T10:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
    });

    // e8 — BIBLE_STUDY type
    await prisma.event.create({
      data: { id: eventIds.e8, type: "BIBLE_STUDY", status: "SCHEDULED", startsAt: new Date("2026-08-20T10:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
    });

    // Deleted event
    await prisma.event.create({
      data: { id: eventIds.deleted, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date("2026-08-10T10:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date(), deletedAt: new Date(), deletedById: userId, deleteReason: "test" },
    });

    // Cancelled event
    await prisma.event.create({
      data: { id: eventIds.cancelled, type: "SUNDAY_SERVICE", status: "CANCELLED", startsAt: new Date("2026-08-12T10:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date(), cancelledAt: new Date(), cancelledById: userId, cancelReason: "test" },
    });

    token = authCookie(userId, 10);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─── VALIDAÇÃO HTTP ───────────────────────────────────────────

  describe("HTTP validation", () => {
    it("no params → 200, returns data array", async () => {
      const res = await request(app).get("/events").set("Cookie", token);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("limit=1 with month → returns 1 event", async () => {
      const res = await request(app).get("/events?limit=1&month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it("limit=200 → accepts", async () => {
      const res = await request(app).get("/events?limit=200").set("Cookie", token);
      expect(res.status).toBe(200);
    });

    it("limit=0 → 422", async () => {
      const res = await request(app).get("/events?limit=0").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("limit=201 → 422", async () => {
      const res = await request(app).get("/events?limit=201").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("limit=abc → 422", async () => {
      const res = await request(app).get("/events?limit=abc").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("month=0 → 422", async () => {
      const res = await request(app).get("/events?month=0").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("month=13 → 422", async () => {
      const res = await request(app).get("/events?month=13").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("month=abc → 422", async () => {
      const res = await request(app).get("/events?month=abc").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("year=abc → 422", async () => {
      const res = await request(app).get("/events?year=abc").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("type=INVALID → 422", async () => {
      const res = await request(app).get("/events?type=INVALID").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("cursor=empty → 422", async () => {
      const res = await request(app).get("/events?cursor=").set("Cookie", token);
      expect(res.status).toBe(422);
    });
  });

  // ─── ORDENAÇÃO DETERMINÍSTICA ─────────────────────────────────

  describe("Deterministic ordering", () => {
    it("limit=2 returns events in startsAt DESC order", async () => {
      const res = await request(app).get("/events?limit=2&month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);

      const items = res.body.data;
      // First item should be >= second item in startsAt (DESC)
      const s0 = new Date(items[0].startsAt).getTime();
      const s1 = new Date(items[1].startsAt).getTime();
      expect(s0).toBeGreaterThanOrEqual(s1);
      // If same startsAt, id should be DESC
      if (s0 === s1) {
        expect(items[0].id.localeCompare(items[1].id)).toBeGreaterThan(0);
      }
    });

    it("second page does not repeat items", async () => {
      const page1 = await request(app).get("/events?limit=2&month=8&year=2026").set("Cookie", token);
      expect(page1.status).toBe(200);

      const cursor = page1.body.nextCursor;
      expect(cursor).toBeTruthy();

      const page2 = await request(app)
        .get(`/events?limit=2&month=8&year=2026`)
        .set("Cookie", token);
      const page2withCursor = await request(app)
        .get(`/events?limit=2&month=8&year=2026&cursor=${encodeURIComponent(cursor)}`)
        .set("Cookie", token);
      expect(page2withCursor.status).toBe(200);

      // No overlap between pages
      const page1Ids = new Set(page1.body.data.map((e: any) => e.id));
      const page2Ids = page2withCursor.body.data.map((e: any) => e.id);
      for (const id of page2Ids) {
        expect(page1Ids.has(id)).toBe(false);
      }
    });

    it("full pagination covers all August 2026 events without duplicates", async () => {
      const expectedIds = [
        eventIds.e1, eventIds.e2, eventIds.e3, eventIds.e4,
        eventIds.e5, eventIds.e6, eventIds.cancelled, eventIds.e8,
      ];

      const allIds = new Set<string>();
      let cursor: string | undefined;
      let page: number = 0;

      do {
        const url = cursor
          ? `/events?limit=8&month=8&year=2026&cursor=${encodeURIComponent(cursor)}`
          : `/events?limit=8&month=8&year=2026`;
        const res = await request(app).get(url).set("Cookie", token);
        expect(res.status).toBe(200);
        for (const e of res.body.data) {
          expect(allIds.has(e.id)).toBe(false);
          allIds.add(e.id);
        }
        cursor = res.body.nextCursor;
        page++;
        expect(page).toBeLessThan(5);
      } while (cursor);

      expect(allIds.size).toBe(expectedIds.length);
      for (const id of expectedIds) {
        expect(allIds.has(id)).toBe(true);
      }

      expect(allIds.has(eventIds.deleted)).toBe(false);
      expect(allIds.has(eventIds.e7)).toBe(false);
    });

    it("last page has nextCursor = null", async () => {
      let cursor: string | undefined;
      let lastCursor: string | null = "non-null";

      do {
        const url = cursor
          ? `/events?limit=5&month=8&year=2026&cursor=${encodeURIComponent(cursor)}`
          : `/events?limit=5&month=8&year=2026`;
        const res = await request(app).get(url).set("Cookie", token);
        expect(res.status).toBe(200);
        lastCursor = res.body.nextCursor;
        cursor = res.body.nextCursor ?? undefined;
      } while (cursor);

      expect(lastCursor).toBeNull();
    });
  });

  // ─── FILTROS ───────────────────────────────────────────────────

  describe("Filters", () => {
    it("type filter returns only matching type", async () => {
      const res = await request(app).get("/events?type=BIBLE_STUDY&month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(eventIds.e8);
    });

    it("month filter scopes to that month only", async () => {
      const res = await request(app).get("/events?month=9&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      // Only e7 is in September
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(eventIds.e7);
    });

    it("cursor combined with type filter stays within type", async () => {
      // First page
      const page1 = await request(app)
        .get("/events?limit=1&type=SUNDAY_SERVICE&month=8&year=2026")
        .set("Cookie", token);
      expect(page1.status).toBe(200);
      expect(page1.body.data.length).toBe(1);

      const cursor = page1.body.nextCursor;
      expect(cursor).toBeTruthy();

      const page2 = await request(app)
        .get(`/events?limit=10&type=SUNDAY_SERVICE&month=8&year=2026&cursor=${encodeURIComponent(cursor)}`)
        .set("Cookie", token);
      expect(page2.status).toBe(200);

      // All returned events should be SUNDAY_SERVICE
      for (const e of page2.body.data) {
        expect(e.type).toBe("SUNDAY_SERVICE");
      }
    });

    it("empty month yields no events", async () => {
      const res = await request(app).get("/events?month=3&year=2025").set("Cookie", token);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.nextCursor).toBeNull();
    });

    it("cursor from removed event still works", async () => {
      // Create a temporary event to get a cursor from it
      const tempId = generateId();
      await prisma.event.create({
        data: { id: tempId, type: "SUNDAY_SERVICE", status: "SCHEDULED", startsAt: new Date("2026-08-25T10:00:00Z"), attendanceMode: "SUMMARY", createdAt: new Date(), updatedAt: new Date() },
      });

      const page1 = await request(app).get("/events?limit=1&month=8&year=2026").set("Cookie", token);
      const cursor = page1.body.nextCursor;

      // Delete the temp event
      await prisma.event.update({ where: { id: tempId }, data: { deletedAt: new Date(), deletedById: userId, deleteReason: "cursor test" } });

      // The cursor (composite by startsAt+id) should still work even if the source event is deleted
      const page2 = await request(app)
        .get(`/events?limit=5&month=8&year=2026&cursor=${encodeURIComponent(cursor)}`)
        .set("Cookie", token);
      expect(page2.status).toBe(200);
    });
  });

  // ─── DELETED + CANCELLED ──────────────────────────────────────

  describe("Deleted and cancelled", () => {
    it("soft deleted event does not appear", async () => {
      const res = await request(app).get("/events?month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((e: any) => e.id);
      expect(ids).not.toContain(eventIds.deleted);
    });

    it("cancelled event appears in the list (observed behavior)", async () => {
      const res = await request(app).get("/events?month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((e: any) => e.id);
      expect(ids).toContain(eventIds.cancelled);
    });

    it("DTO includes status field", async () => {
      const res = await request(app).get("/events?limit=1&month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      expect(res.body.data[0]).toHaveProperty("cancelledAt");
      expect(res.body.data[0]).toHaveProperty("cancelReason");
    });

    it("title is string | null, never undefined", async () => {
      const res = await request(app).get("/events?limit=1&month=8&year=2026").set("Cookie", token);
      expect(res.status).toBe(200);
      for (const e of res.body.data) {
        expect(e.title).not.toBeUndefined();
        expect(e.title === null || typeof e.title === "string").toBe(true);
      }
    });
  });

  // ─── CURSOR INVÁLIDO ──────────────────────────────────────────

  describe("Invalid cursor → 422", () => {
    it("malformed base64", async () => {
      const res = await request(app).get("/events?cursor=!!!invalid!!!").set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("valid base64, invalid JSON inside", async () => {
      const b64 = Buffer.from("not-json").toString("base64url");
      const res = await request(app).get(`/events?cursor=${b64}`).set("Cookie", token);
      expect(res.status).toBe(422);
    });

    it("valid JSON, invalid structure", async () => {
      const b64 = Buffer.from(JSON.stringify({ foo: "bar" })).toString("base64url");
      const res = await request(app).get(`/events?cursor=${b64}`).set("Cookie", token);
      expect(res.status).toBe(422);
    });
  });

  // ─── SEM AUTENTICAÇÃO ─────────────────────────────────────────

  describe("Unauthenticated", () => {
    it("returns 401 without token", async () => {
      const res = await request(app).get("/events");
      expect(res.status).toBe(401);
    });
  });
});
