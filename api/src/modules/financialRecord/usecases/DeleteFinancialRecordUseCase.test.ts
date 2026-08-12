import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteFinancialRecordUseCase } from "./DeleteFinancialRecordUseCase";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { FinancialRecord } from "../domain/entities/FinancialRecord";
import { Decimal } from "@prisma/client/runtime/library";

function makeRecord(overrides: Record<string, any> = {}) {
  return FinancialRecord.create({
    amount: new Decimal(100),
    method: "PIX" as any,
    date: new Date(),
    direction: "INCOME" as any,
    recordedById: "user-1",
    categoryId: "cat-1",
    ...overrides,
  });
}

describe("DeleteFinancialRecordUseCase", () => {
  let mockRepo: any;
  let useCase: DeleteFinancialRecordUseCase;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      markAsCancelledIfActive: vi.fn(),
    };
    useCase = new DeleteFinancialRecordUseCase(mockRepo);
  });

  it("deve cancelar registro ACTIVE com sucesso", async () => {
    const record = makeRecord();
    mockRepo.findById.mockResolvedValue(record);
    mockRepo.markAsCancelledIfActive.mockResolvedValue(true);

    await useCase.execute({
      financialRecordId: record.id,
      deletedById: "user-2",
      reason: "Erro na entrada",
    });

    expect(mockRepo.markAsCancelledIfActive).toHaveBeenCalledWith(
      expect.objectContaining({
        id: record.id,
        cancelledById: "user-2",
        cancelReason: "Erro na entrada",
      }),
    );
  });

  it("deve lançar ValidationError se registro não existir", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ financialRecordId: "not-found", deletedById: "user-2" }),
    ).rejects.toThrow(ValidationError);
  });

  it("deve lançar ConflictError se registro for REVERSED", async () => {
    const record = makeRecord();
    record.reverse("user-1", "Estornado");
    mockRepo.findById.mockResolvedValue(record);

    await expect(
      useCase.execute({ financialRecordId: record.id, deletedById: "user-2", reason: "teste" }),
    ).rejects.toThrow(ConflictError);
  });

  it("deve lançar ConflictError se registro for estorno (reversalOfId setado)", async () => {
    const record = FinancialRecord.create({
      amount: new Decimal(50),
      method: "CASH" as any,
      date: new Date(),
      direction: "EXPENSE" as any,
      recordedById: "user-2",
      categoryId: "cat-2",
      reversalOfId: "original-1",
    });
    mockRepo.findById.mockResolvedValue(record);

    await expect(
      useCase.execute({ financialRecordId: record.id, deletedById: "user-3", reason: "teste" }),
    ).rejects.toThrow(ConflictError);
  });
});
