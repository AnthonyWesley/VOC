import { PrismaClient } from "@prisma/client";

export const INTEGRATION_DATABASE_URL =
  "postgresql://voc:voc_local@localhost:15432/voc_test?schema=public";

export function createTestPrisma(): PrismaClient {
  if (!INTEGRATION_DATABASE_URL.includes("voc_test")) {
    throw new Error("Integration tests require the isolated voc_test database");
  }
  return new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
}

export async function cleanIntegrationDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.financialRecord.deleteMany(),
    prisma.eventAssignment.deleteMany(),
    prisma.eventAttendance.deleteMany(),
    prisma.eventCorrection.deleteMany(),
    prisma.memberRestoreLog.deleteMany(),
    prisma.eventMember.deleteMany(),
    prisma.memberMinistry.deleteMany(),
    prisma.post.deleteMany(),
    prisma.event.deleteMany(),
    prisma.ministry.deleteMany(),
    prisma.member.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.user.deleteMany(),
    prisma.category.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.role.deleteMany(),
    prisma.siteContentSettings.deleteMany(),
  ]);
  await prisma.$executeRawUnsafe(`DELETE FROM "JobLease"`);
}

export async function seedTestCategories(prisma: PrismaClient) {
  const cats = await Promise.all([
    prisma.category.create({ data: { id: "cat-income-1", name: "Dízimo", type: "INCOME" } }),
    prisma.category.create({ data: { id: "cat-income-2", name: "Oferta", type: "INCOME" } }),
    prisma.category.create({ data: { id: "cat-expense-1", name: "Despesa", type: "EXPENSE" } }),
  ]);
  return Object.fromEntries(cats.map(c => [c.name, c]));
}

export async function seedTestUser(prisma: PrismaClient, roleLevel: number = 80) {
  const role = await prisma.role.upsert({
    where: { name: roleLevel >= 80 ? "TREASURER" : "MEMBER" },
    update: {},
    create: {
      id: `role-${roleLevel}`,
      name: roleLevel >= 80 ? "TREASURER" : "MEMBER",
      level: roleLevel,
      description: "Test role",
    },
  });

  const user = await prisma.user.create({
    data: {
      id: "user-test-1",
      email: "test@test.com",
      passwordHash: "hash",
      isActive: true,
      roles: { create: { roleId: role.id } },
    },
  });

  // Extra user IDs for FK references in tests
  await prisma.user.createMany({
    data: [
      { id: "u-1", email: "u1@t.com", passwordHash: "h", isActive: true },
      { id: "u-2", email: "u2@t.com", passwordHash: "h", isActive: true },
      { id: "u-r", email: "ur@t.com", passwordHash: "h", isActive: true },
      { id: "user-canceller", email: "uc@t.com", passwordHash: "h", isActive: true },
      { id: "u-conc", email: "uconc@t.com", passwordHash: "h", isActive: true },
    ],
    skipDuplicates: true,
  });

  return { user, role };
}

export async function seedFinancialRecord(
  prisma: PrismaClient,
  overrides: Record<string, any> = {},
) {
  const defaults = {
    id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    amount: 100,
    method: "PIX" as const,
    date: new Date(),
    direction: "INCOME" as const,
    recordedById: "user-test-1",
    status: "ACTIVE" as const,
    categoryId: "cat-income-1",
    description: "Test record",
  };
  const data = { ...defaults, ...overrides };
  return prisma.financialRecord.create({ data });
}
