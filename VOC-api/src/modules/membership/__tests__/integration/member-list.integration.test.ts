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

describe("0H.3A — Member list", () => {
  let prisma: PrismaClient;
  const memberToken = authCookie("u-list-user", 10);

  const memberIds = Array.from({ length: 25 }, () => generateId());

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-list", name: "MEMBER", level: 10 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: "u-list-user", email: "list@test.com", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: "u-list-user", roleId: "r-list" },
      ],
    });

    for (let i = 0; i < memberIds.length; i++) {
      await prisma.member.create({
        data: {
          id: memberIds[i],
          fullName: `Member ${i + 1}`,
          normalizedFullName: `member ${i + 1}`,
          birthDate: new Date(1980 + (i % 30), (i % 12), (i % 28) + 1),
          churchJoinDate: new Date(),
          createdAt: new Date(2026, 6, 28, 0, 0, i),
          status: i < 3 ? "ACTIVE" as const : i < 6 ? "INACTIVE" as const : i < 8 ? "VISITOR" as const : "ACTIVE" as const,
        },
      });
    }

    // One soft-deleted member
    await prisma.member.create({
      data: {
        id: generateId(),
        fullName: "Deleted Member",
        normalizedFullName: "deleted member",
        birthDate: new Date("2000-01-01"),
        churchJoinDate: new Date(),
        deletedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await cleanIntegrationDatabase(prisma);
    await prisma.$disconnect();
  });

  describe("mode=all", () => {
    it("200 returns paginated members", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "all" })
        .set("Cookie", memberToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.length).toBeLessThanOrEqual(20);
      expect(res.body).toHaveProperty("nextCursor");
    });

    it("200 respects limit", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "all", limit: "5" })
        .set("Cookie", memberToken);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it("200 cursor pagination returns next page", async () => {
      const first = await request(app)
        .get("/members")
        .query({ mode: "all", limit: "10" })
        .set("Cookie", memberToken);

      expect(first.body.nextCursor).toBeTruthy();

      const second = await request(app)
        .get("/members")
        .query({ mode: "all", limit: "10", cursor: first.body.nextCursor })
        .set("Cookie", memberToken);

      expect(second.status).toBe(200);
      expect(second.body.data.length).toBeGreaterThan(0);

      const firstIds = first.body.data.map((m: any) => m.id);
      const secondIds = second.body.data.map((m: any) => m.id);
      const overlap = firstIds.filter((id: string) => secondIds.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it("200 cursor is null on last page", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "all", limit: "200" })
        .set("Cookie", memberToken);

      expect(res.status).toBe(200);
      expect(res.body.nextCursor).toBeNull();
    });

    it("200 search filters by name", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "all", search: "member 1" })
        .set("Cookie", memberToken);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((m: any) =>
        m.fullName.toLowerCase().includes("member 1"),
      )).toBe(true);
    });

    it("200 status filter", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "all", status: "INACTIVE" })
        .set("Cookie", memberToken);

      expect(res.status).toBe(200);
      expect(res.body.data.every((m: any) => m.status === "INACTIVE")).toBe(true);
    });

    it("200 soft-deleted members are excluded", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "all" })
        .set("Cookie", memberToken);

      expect(res.status).toBe(200);
      expect(res.body.data.every((m: any) => m.fullName !== "Deleted Member")).toBe(true);
    });

    it("200 search is case-insensitive", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "all", search: "MEMBER 1" })
        .set("Cookie", memberToken);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("mode=event", () => {
    let eventId: string;

    beforeAll(async () => {
      eventId = generateId();
      await prisma.event.create({
        data: {
          id: eventId,
          title: "List Test Event",
          type: "SUNDAY_SERVICE",
          status: "SCHEDULED",
          startsAt: new Date("2026-08-15T10:00:00Z"),
          attendanceMode: "INDIVIDUAL",
        },
      });

      // Assign first 3 members to the event
      await prisma.eventMember.createMany({
        data: memberIds.slice(0, 3).map((id) => ({ eventId, memberId: id })),
      });
    });

    it("200 returns members not in the event", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "event", eventId })
        .set("Cookie", memberToken);

      expect(res.status).toBe(200);
      const assignedIds = memberIds.slice(0, 3);
      expect(res.body.data.every((m: any) => !assignedIds.includes(m.id))).toBe(true);
    });

    it("422 missing eventId", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "event" })
        .set("Cookie", memberToken);

      expect(res.status).toBe(422);
    });
  });

  describe("mode=ministry", () => {
    let ministryId: string;

    beforeAll(async () => {
      ministryId = generateId();
      const leaderMemberId = generateId();
      await prisma.member.create({
        data: {
          id: leaderMemberId,
          fullName: "Ministry Leader",
          normalizedFullName: "ministry leader",
          birthDate: new Date("1990-01-01"),
          churchJoinDate: new Date(),
        },
      });
      await prisma.ministry.create({
        data: {
          id: ministryId,
          name: "List Test Ministry",
          description: "For testing list mode=ministry",
          leaderId: leaderMemberId,
        },
      });

      // Add first 3 members to the ministry
      await prisma.memberMinistry.createMany({
        data: memberIds.slice(0, 3).map((id) => ({ ministryId, memberId: id, joinedAt: new Date() })),
      });
    });

    it("200 returns members not in the ministry", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "ministry", ministryId })
        .set("Cookie", memberToken);

      expect(res.status).toBe(200);
      const ministryMemberIds = memberIds.slice(0, 3);
      expect(res.body.data.every((m: any) => !ministryMemberIds.includes(m.id))).toBe(true);
    });

    it("422 missing ministryId", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "ministry" })
        .set("Cookie", memberToken);

      expect(res.status).toBe(422);
    });
  });

  describe("mode=assignment", () => {
    let eventId: string;
    let ministryId: string;

    beforeAll(async () => {
      eventId = generateId();
      ministryId = generateId();

      const assLeaderId = generateId();
      await prisma.member.create({
        data: {
          id: assLeaderId,
          fullName: "Assignment Leader",
          normalizedFullName: "assignment leader",
          birthDate: new Date("1990-01-01"),
          churchJoinDate: new Date(),
        },
      });

      await prisma.ministry.create({
        data: {
          id: ministryId,
          name: "Assignment Ministry",
          description: "For testing assignment mode",
          leaderId: assLeaderId,
        },
      });

      await prisma.event.create({
        data: {
          id: eventId,
          title: "Assignment Event",
          type: "SUNDAY_SERVICE",
          status: "SCHEDULED",
          startsAt: new Date("2026-09-01T10:00:00Z"),
          attendanceMode: "INDIVIDUAL",
        },
      });

      // Members 4-7 are in the ministry
      await prisma.memberMinistry.createMany({
        data: memberIds.slice(4, 8).map((id) => ({ ministryId, memberId: id, joinedAt: new Date() })),
      });

      // Member 4 is already assigned
      await prisma.eventAssignment.create({
        data: { eventId, ministryId, memberId: memberIds[4] },
      });
    });

    it("200 returns ministry members not yet assigned", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "assignment", eventId, ministryId })
        .set("Cookie", memberToken);

      expect(res.status).toBe(200);
      const assignedId = memberIds[4];
      expect(res.body.data.every((m: any) => m.id !== assignedId)).toBe(true);
      // Members 5,6,7 should be in the list
      const returnedIds = res.body.data.map((m: any) => m.id);
      expect(returnedIds).toContain(memberIds[5]);
      expect(returnedIds).toContain(memberIds[6]);
      expect(returnedIds).toContain(memberIds[7]);
    });

    it("422 missing eventId", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "assignment", ministryId })
        .set("Cookie", memberToken);

      expect(res.status).toBe(422);
    });

    it("422 missing ministryId", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "assignment", eventId })
        .set("Cookie", memberToken);

      expect(res.status).toBe(422);
    });
  });

  describe("mode validation", () => {
    it("422 missing mode", async () => {
      const res = await request(app)
        .get("/members")
        .set("Cookie", memberToken);

      expect(res.status).toBe(422);
    });

    it("422 invalid mode", async () => {
      const res = await request(app)
        .get("/members")
        .query({ mode: "invalid" })
        .set("Cookie", memberToken);

      expect(res.status).toBe(422);
    });
  });
});
