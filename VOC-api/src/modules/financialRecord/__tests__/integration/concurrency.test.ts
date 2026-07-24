import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaFinancialRecordRepository } from "../../domain/repositories/PrismaFinancialRecordRepository";
import { PrismaFinancialRecordUnitOfWork } from "../../infra/unitOfWork";
import { ReverseFinancialRecordUseCase } from "../../usecases/ReverseFinancialRecordUseCase";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase, seedTestCategories, seedTestUser, seedFinancialRecord } from "../../../../__tests__/helpers";

const ITERATIONS = 20;

describe("Concorrência — PostgreSQL", () => {
  let prismaA: PrismaClient;
  let prismaB: PrismaClient;

  beforeAll(async () => {
    prismaA = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    prismaB = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await seedTestCategories(prismaA);
    await seedTestUser(prismaA);
  });

  afterAll(async () => {
    await cleanIntegrationDatabase(prismaA);
    await prismaA.$disconnect();
    await prismaB.$disconnect();
  });

  it("duas chamadas simultâneas produzem exatamente um reversal", async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const recId = `conc-${i}-${Date.now()}`;
      await seedFinancialRecord(prismaA, { id: recId, amount: 100, direction: "INCOME" });

      const repoA = new PrismaFinancialRecordRepository(prismaA);
      const repoB = new PrismaFinancialRecordRepository(prismaB);
      const uowA = new PrismaFinancialRecordUnitOfWork(prismaA);
      const uowB = new PrismaFinancialRecordUnitOfWork(prismaB);
      const useCaseA = new ReverseFinancialRecordUseCase(uowA, repoA);
      const useCaseB = new ReverseFinancialRecordUseCase(uowB, repoB);
      const input = { financialRecordId: recId, reversedById: "u-conc", reason: "Concorrência" };

      const results = await Promise.allSettled([useCaseA.execute(input), useCaseB.execute(input)]);

      const count = await prismaA.financialRecord.count({ where: { reversalOfId: recId } });
      const original = await prismaA.financialRecord.findUnique({ where: { id: recId } });
      expect(count).toBe(1);
      expect(original!.status).toBe("REVERSED");

      const successes = results.filter(r => r.status === "fulfilled");
      expect(successes.length).toBe(2);

      const statuses = results.map(r => r.status === "fulfilled" ? ((r.value as any).alreadyReversed ? "already" : "created") : "rejected");
      expect(statuses).toContain("created");
      expect(statuses).toContain("already");

      await prismaA.$executeRawUnsafe(`DELETE FROM "FinancialRecord" WHERE "id" = $1 OR "reversalOfId" = $1`, recId);
    }
  }, 120_000);
});
