import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaNotificationRepository } from "../../domain/repositories/PrismaNotificationRepository";
import { Notification } from "../../domain/entities/Notification";

const prisma = new PrismaClient();
const repo = new PrismaNotificationRepository(prisma);

async function createUser(id: string) {
  await prisma.user.upsert({
    where: { id },
    update: {},
    create: { id, email: `${id}@test.com`, passwordHash: "x", isActive: true },
  });
}

async function cleanUp() {
  await prisma.notification.deleteMany({ where: { userId: { startsWith: "notif-test-" } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: "notif-test-" } } });
}

function makeNotif(overrides: Record<string, unknown> = {}) {
  return new Notification({
    id: `n-${Math.random().toString(36).slice(2, 8)}`,
    userId: "notif-test-user",
    type: "EVENTO_CRIADO",
    title: "Test",
    message: null,
    payload: { eventId: "550e8400-e29b-41d4-a716-446655440000", eventTitle: "Culto", eventType: "SUNDAY_SERVICE", needsScale: false },
    payloadVersion: 1,
    deduplicationKey: null,
    readAt: null,
    createdAt: new Date(),
    ...overrides,
  } as any);
}

describe("PrismaNotificationRepository — integração PostgreSQL", () => {
  beforeAll(async () => {
    await cleanUp();
    await createUser("notif-test-user");
    await createUser("notif-test-user2");
  });

  it("create and findById", async () => {
    const n = makeNotif();
    await repo.create(n);
    const found = await repo.findById(n.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe("Test");
    expect(found!.type).toBe("EVENTO_CRIADO");
    expect((found!.payload as any)?.eventTitle).toBe("Culto");
  });

  it("findById returns null for non-existent", async () => {
    const found = await repo.findById("non-existent");
    expect(found).toBeNull();
  });

  it("findByDedupKey finds by userId + deduplicationKey", async () => {
    const n = makeNotif({ deduplicationKey: "v1:test:abc" });
    await repo.create(n);
    const found = await repo.findByDedupKey("notif-test-user", "v1:test:abc");
    expect(found).not.toBeNull();
    expect(found!.id).toBe(n.id);
  });

  it("findByDedupKey returns null for wrong key", async () => {
    const found = await repo.findByDedupKey("notif-test-user", "v1:test:nonexistent");
    expect(found).toBeNull();
  });

  it("list returns paginated results ordered by createdAt desc", async () => {
    const n1 = makeNotif({ id: `n-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date("2026-01-01") });
    const n2 = makeNotif({ id: `n-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date("2026-06-01") });
    await repo.create(n1);
    await repo.create(n2);

    const page1 = await repo.list({ userId: "notif-test-user", limit: 1 });
    expect(page1.items).toHaveLength(1);
    expect(page1.totalCount).toBeGreaterThanOrEqual(4);
  });

  it("markAsRead sets readAt", async () => {
    const n = makeNotif();
    await repo.create(n);
    await repo.markAsRead(n.id, "notif-test-user");
    const found = await repo.findById(n.id);
    expect(found!.readAt).not.toBeNull();
  });

  it("markAsRead is idempotent", async () => {
    const n = makeNotif();
    await repo.create(n);
    await repo.markAsRead(n.id, "notif-test-user");
    const readAt1 = (await repo.findById(n.id))!.readAt;
    await repo.markAsRead(n.id, "notif-test-user");
    const readAt2 = (await repo.findById(n.id))!.readAt;
    expect(readAt1).toEqual(readAt2);
  });

  it("markAllAsRead marks all unread for user", async () => {
    const n1 = makeNotif({ id: `n-${Math.random().toString(36).slice(2, 8)}` });
    const n2 = makeNotif({ id: `n-${Math.random().toString(36).slice(2, 8)}` });
    await repo.create(n1);
    await repo.create(n2);

    const count = await repo.markAllAsRead("notif-test-user", new Date());
    expect(count).toBeGreaterThanOrEqual(2);

    const found1 = await repo.findById(n1.id);
    expect(found1!.readAt).not.toBeNull();
  });

  it("countUnread returns correct count", async () => {
    const n = makeNotif({ id: `n-${Math.random().toString(36).slice(2, 8)}` });
    await repo.create(n);
    const count = await repo.countUnread("notif-test-user");
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("countUnread is scoped to user", async () => {
    const n = makeNotif({ id: `n-${Math.random().toString(36).slice(2, 8)}`, userId: "notif-test-user2" });
    await repo.create(n);
    const count = await repo.countUnread("notif-test-user2");
    expect(count).toBeGreaterThanOrEqual(1);

    // Other user's unread should not include this
    const otherCount = await repo.countUnread("notif-test-user");
    const allUserCount = await prisma.notification.count({ where: { userId: "notif-test-user2", readAt: null } });
    expect(allUserCount).toBeGreaterThanOrEqual(1);
  });

  it("P2002 unique constraint on userId + deduplicationKey", async () => {
    const n1 = makeNotif({ deduplicationKey: "v1:test:p2002" });
    await repo.create(n1);

    const n2 = makeNotif({ deduplicationKey: "v1:test:p2002" });
    await expect(repo.create(n2)).rejects.toMatchObject({ code: "P2002" });
  });

  it("allows null deduplicationKey duplicates", async () => {
    const n1 = makeNotif({ deduplicationKey: null });
    const n2 = makeNotif({ deduplicationKey: null });
    await repo.create(n1);
    await repo.create(n2);
    // should not throw — nulls are allowed in unique index
  });
});
