import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaFinancialRecordRepository } from "../../domain/repositories/PrismaFinancialRecordRepository";
import { PrismaFinancialRecordUnitOfWork } from "../../infra/unitOfWork";
import { FinancialRecord } from "../../domain/entities/FinancialRecord";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase, seedTestCategories, seedTestUser, seedFinancialRecord } from "../../../../__tests__/helpers";

describe("Rollback — PostgreSQL", () => {
  let prisma: PrismaClient;
  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await seedTestCategories(prisma);
    await seedTestUser(prisma);
  });
  beforeEach(async () => { await prisma.financialRecord.deleteMany(); });
  afterAll(async () => { await cleanIntegrationDatabase(prisma); await prisma.$disconnect(); });

  it("UoW: erro explícito após CAS → original ACTIVE", async () => {
    const record = await seedFinancialRecord(prisma, { id: "rb-uow-1" });
    const uow = new PrismaFinancialRecordUnitOfWork(prisma);
    await expect(uow.execute(async ({ financialRecords }) => {
      const original = await financialRecords.findById(record.id);
      original!.reverse("u-1", "Estorno");
      await financialRecords.markAsReversedIfActive({ id: original!.id, reversedAt: original!.reversedAt!, reversedById: original!.reversedById!, reverseReason: original!.reverseReason });
      throw new Error("SIMULATED_FAILURE_AFTER_CAS");
    })).rejects.toThrow("SIMULATED_FAILURE_AFTER_CAS");
    expect((await prisma.financialRecord.findUnique({ where: { id: record.id } }))!.status).toBe("ACTIVE");
  });

  it("UoW: CAS + falha no create → rollback", async () => {
    const record = await seedFinancialRecord(prisma, { id: "rb-fail-1" });
    const repo = new PrismaFinancialRecordRepository(prisma);

    await expect(prisma.$transaction(async (tx) => {
      const txRepo = new PrismaFinancialRecordRepository(tx);
      const original = await txRepo.findById(record.id);
      original!.reverse("u-1", "Estorno");
      const ok = await txRepo.markAsReversedIfActive({ id: original!.id, reversedAt: original!.reversedAt!, reversedById: original!.reversedById!, reverseReason: original!.reverseReason });
      expect(ok).toBe(true);

      // Simulate failure by attempting to create a reversal with an invalid FK
      await txRepo.create(FinancialRecord.create({
        amount: original!.amount,
        method: original!.method,
        date: new Date(),
        direction: "EXPENSE" as any,
        recordedById: "nonexistent-user-id",
        categoryId: original!.categoryId,
        reversalOfId: original!.id,
      }));
    })).rejects.toThrow();

    const reloaded = await prisma.financialRecord.findUnique({ where: { id: record.id } });
    expect(reloaded!.status).toBe("ACTIVE");
    expect(reloaded!.reversedAt).toBeNull();
  });
});
