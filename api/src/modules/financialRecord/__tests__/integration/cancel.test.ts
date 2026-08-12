import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { DeleteFinancialRecordUseCase } from "../../usecases/DeleteFinancialRecordUseCase";
import { PrismaFinancialRecordRepository } from "../../domain/repositories/PrismaFinancialRecordRepository";
import { ConflictError } from "../../../../shared/errors/ConflictError";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase, seedTestCategories, seedTestUser, seedFinancialRecord } from "../../../../__tests__/helpers";

describe("Cancelamento — integração PostgreSQL", () => {
  let prisma: PrismaClient;
  let repo: PrismaFinancialRecordRepository;
  let useCase: DeleteFinancialRecordUseCase;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    repo = new PrismaFinancialRecordRepository(prisma);
    useCase = new DeleteFinancialRecordUseCase(repo);
    await seedTestCategories(prisma);
    await seedTestUser(prisma);
  });

  beforeEach(async () => {
    await prisma.financialRecord.deleteMany();
  });

  afterAll(async () => {
    await cleanIntegrationDatabase(prisma);
    await prisma.$disconnect();
  });

  it("deve cancelar registro ACTIVE com sucesso", async () => {
    const record = await seedFinancialRecord(prisma);
    await useCase.execute({ financialRecordId: record.id, deletedById: "user-canceller", reason: "Erro na entrada" });

    const cancelled = await prisma.financialRecord.findUnique({ where: { id: record.id } });
    expect(cancelled!.status).toBe("CANCELLED");
    expect(cancelled!.cancelledAt).toBeInstanceOf(Date);
    expect(cancelled!.cancelledById).toBe("user-canceller");
    expect(cancelled!.cancelReason).toBe("Erro na entrada");
  });

  it("deve lançar erro se registro não existir", async () => {
    await expect(useCase.execute({ financialRecordId: "not-found", deletedById: "user-1" })).rejects.toThrow(ValidationError);
  });

  it("deve lançar erro se já cancelado", async () => {
    const record = await seedFinancialRecord(prisma);
    await useCase.execute({ financialRecordId: record.id, deletedById: "u-1", reason: "Primeiro" });
    await expect(useCase.execute({ financialRecordId: record.id, deletedById: "u-1", reason: "Segundo" })).rejects.toThrow(ConflictError);
  });

  it("deve lançar erro se REVERSED", async () => {
    const record = await seedFinancialRecord(prisma, { status: "REVERSED" });
    await expect(useCase.execute({ financialRecordId: record.id, deletedById: "user-1" })).rejects.toThrow(ConflictError);
  });

  it("deve lançar erro se for reversal record", async () => {
    await seedFinancialRecord(prisma, { id: "orig-for-reversal" });
    const record = await seedFinancialRecord(prisma, { id: "rev-rec", reversalOfId: "orig-for-reversal", direction: "EXPENSE" });
    await expect(useCase.execute({ financialRecordId: record.id, deletedById: "user-canceller" })).rejects.toThrow(ConflictError);
  });

  it("findAll exclui CANCELLED", async () => {
    await seedFinancialRecord(prisma, { id: "rec-active" });
    await seedFinancialRecord(prisma, { id: "rec-cancelled", status: "CANCELLED", cancelledAt: new Date(), cancelledById: "u-1", cancelReason: "T" });
    const all = await repo.findAll();
    expect(all.find(r => r.id === "rec-cancelled")).toBeUndefined();
    expect(all.find(r => r.id === "rec-active")).toBeDefined();
  });

  it("includeCancelled=true inclui CANCELLED", async () => {
    await seedFinancialRecord(prisma, { id: "rec-active-2" });
    await seedFinancialRecord(prisma, { id: "rec-cancelled-2", status: "CANCELLED", cancelledAt: new Date(), cancelledById: "u-1", cancelReason: "T" });
    const all = await repo.findAll({ includeCancelled: true });
    expect(all.find(r => r.id === "rec-cancelled-2")).toBeDefined();
    expect(all.find(r => r.id === "rec-active-2")).toBeDefined();
  });
});
