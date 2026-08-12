import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaFinancialRecordRepository } from "../../domain/repositories/PrismaFinancialRecordRepository";
import { PrismaFinancialRecordUnitOfWork } from "../../infra/unitOfWork";
import { ReverseFinancialRecordUseCase } from "../../usecases/ReverseFinancialRecordUseCase";
import { ConflictError } from "../../../../shared/errors/ConflictError";
import { NotFoundError } from "../../../../shared/errors/NotFoundError";
import { DataIntegrityError } from "../../../../shared/errors/DataIntegrityError";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase, seedTestCategories, seedTestUser, seedFinancialRecord } from "../../../../__tests__/helpers";

describe("Reverse — integração PostgreSQL", () => {
  let prisma: PrismaClient;
  let repo: PrismaFinancialRecordRepository;
  let uow: PrismaFinancialRecordUnitOfWork;
  let useCase: ReverseFinancialRecordUseCase;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    repo = new PrismaFinancialRecordRepository(prisma);
    uow = new PrismaFinancialRecordUnitOfWork(prisma);
    useCase = new ReverseFinancialRecordUseCase(uow, repo);
    await seedTestCategories(prisma);
    await seedTestUser(prisma);
  });

  beforeEach(async () => { await prisma.financialRecord.deleteMany(); });

  afterAll(async () => { await cleanIntegrationDatabase(prisma); await prisma.$disconnect(); });

  it("deve estornar receita: original REVERSED, reversal EXPENSE", async () => {
    const original = await seedFinancialRecord(prisma, { id: "rev-1", amount: 100, direction: "INCOME" });
    const result = await useCase.execute({ financialRecordId: original.id, reversedById: "u-r", reason: "Erro" });

    const updated = await prisma.financialRecord.findUnique({ where: { id: original.id } });
    expect(updated!.status).toBe("REVERSED");
    expect(updated!.reversedById).toBe("u-r");

    const reversal = await prisma.financialRecord.findFirst({ where: { reversalOfId: original.id } });
    expect(reversal).not.toBeNull();
    expect(reversal!.status).toBe("ACTIVE");
    expect(reversal!.direction).toBe("EXPENSE");
    expect(reversal!.categoryId).toBe(original.categoryId);
    expect(reversal!.amount.toString()).toBe("100");
    expect(result.reversalId).toBe(reversal!.id);
  });

  it("deve estornar despesa: reversal INCOME", async () => {
    const original = await seedFinancialRecord(prisma, { id: "rev-2", amount: 200, direction: "EXPENSE", categoryId: "cat-expense-1" });
    await useCase.execute({ financialRecordId: original.id, reversedById: "u-r", reason: "Erro" });
    const reversal = await prisma.financialRecord.findFirst({ where: { reversalOfId: original.id } });
    expect(reversal!.direction).toBe("INCOME");
  });

  it("idempotência: segunda chamada retorna alreadyReversed", async () => {
    const original = await seedFinancialRecord(prisma, { id: "rev-idemp", amount: 150 });
    await useCase.execute({ financialRecordId: original.id, reversedById: "u-1", reason: "1" });
    const second = await useCase.execute({ financialRecordId: original.id, reversedById: "u-2", reason: "2" });
    expect(second.alreadyReversed).toBe(true);
    expect(await prisma.financialRecord.count({ where: { reversalOfId: original.id } })).toBe(1);
  });

  it("NotFoundError se registro não existe", async () => {
    await expect(useCase.execute({ financialRecordId: "not-found", reversedById: "u-1" })).rejects.toThrow(NotFoundError);
  });

  it("ConflictError se cancelado", async () => {
    const r = await seedFinancialRecord(prisma, { id: "rev-canc", status: "CANCELLED", cancelledAt: new Date(), cancelledById: "u-1", cancelReason: "T" });
    await expect(useCase.execute({ financialRecordId: r.id, reversedById: "u-2" })).rejects.toThrow(ConflictError);
  });

  it("ConflictError se for reversal record", async () => {
    await seedFinancialRecord(prisma, { id: "orig-for-reversal-2" });
    const r = await seedFinancialRecord(prisma, { id: "rev-rev", direction: "EXPENSE", reversalOfId: "orig-for-reversal-2" });
    await expect(useCase.execute({ financialRecordId: r.id, reversedById: "u-2" })).rejects.toThrow(ConflictError);
  });

  it("ConflictError se REVERSED sem reversal (entity rejeita antes do use case)", async () => {
    const r = await seedFinancialRecord(prisma, { id: "rev-orphan", status: "REVERSED", reversedAt: new Date(), reversedById: "u-1", reverseReason: "T" });
    await expect(useCase.execute({ financialRecordId: r.id, reversedById: "u-2" })).rejects.toThrow(ConflictError);
  });
});
