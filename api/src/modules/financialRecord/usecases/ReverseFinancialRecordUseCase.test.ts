import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReverseFinancialRecordUseCase } from "./ReverseFinancialRecordUseCase";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { DataIntegrityError } from "../../../shared/errors/DataIntegrityError";
import { FinancialRecord } from "../domain/entities/FinancialRecord";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";

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

function makeUoW(mockRepo: any) {
  return {
    execute: vi.fn().mockImplementation(
      (fn: (repos: { financialRecords: any }) => any) => fn({ financialRecords: mockRepo }),
    ),
  };
}

describe("ReverseFinancialRecordUseCase", () => {
  let mockRepo: any;
  let uow: any;
  let useCase: ReverseFinancialRecordUseCase;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByReversalOfId: vi.fn(),
      markAsReversedIfActive: vi.fn(),
      create: vi.fn(),
    };
    uow = makeUoW(mockRepo);
    useCase = new ReverseFinancialRecordUseCase(uow, mockRepo);
  });

  it("deve estornar com sucesso: original REVERSED, reversal ACTIVE com direção oposta", async () => {
    const original = makeRecord({ amount: new Decimal(100), direction: "INCOME" });
    mockRepo.findById.mockResolvedValue(original);
    mockRepo.findByReversalOfId.mockResolvedValue(null);
    mockRepo.markAsReversedIfActive.mockResolvedValue(true);
    mockRepo.create.mockResolvedValue(undefined);

    const result = await useCase.execute({
      financialRecordId: original.id,
      reversedById: "user-2",
      reason: "Erro na entrada",
    });

    expect(result.status).toBe("REVERSED");
    expect(result.alreadyReversed).toBeUndefined();
    expect(mockRepo.markAsReversedIfActive).toHaveBeenCalledOnce();
    expect(mockRepo.create).toHaveBeenCalledOnce();

    const reversal = mockRepo.create.mock.calls[0][0];
    expect(reversal.direction).toBe("EXPENSE");
    expect(reversal.reversalOfId).toBe(original.id);
    expect(reversal.categoryId).toBe(original.categoryId);
  });

  it("deve herdar a categoria do original no estorno", async () => {
    const original = makeRecord({ categoryId: "cat-income-1", direction: "INCOME" });
    mockRepo.findById.mockResolvedValue(original);
    mockRepo.findByReversalOfId.mockResolvedValue(null);
    mockRepo.markAsReversedIfActive.mockResolvedValue(true);

    await useCase.execute({
      financialRecordId: original.id,
      reversedById: "user-2",
      reason: "Teste",
    });

    const reversal = mockRepo.create.mock.calls[0][0];
    expect(reversal.categoryId).toBe("cat-income-1");
  });

  it("deve lançar NotFoundError se registro não existir", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ financialRecordId: "not-found", reversedById: "user-2", reason: "test" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve lançar ConflictError se registro já estiver cancelado", async () => {
    const original = makeRecord();
    original.cancel("user-1", "Cancelamento");
    mockRepo.findById.mockResolvedValue(original);

    await expect(
      useCase.execute({ financialRecordId: original.id, reversedById: "user-2", reason: "test" }),
    ).rejects.toThrow(ConflictError);
  });

  it("deve retornar alreadyReversed via idempotência se reversal já existir", async () => {
    const original = makeRecord();
    original.reverse("user-1", "Estorno");
    const reversal = FinancialRecord.create({
      amount: original.amount,
      method: original.method,
      date: new Date(),
      direction: "EXPENSE" as any,
      recordedById: "user-2",
      categoryId: "cat-2",
      reversalOfId: original.id,
    });

    mockRepo.findById.mockResolvedValue(original);
    mockRepo.findByReversalOfId.mockResolvedValue(reversal);

    const result = await useCase.execute({
      financialRecordId: original.id,
      reversedById: "user-2",
      reason: "Retry",
    });

    expect(result.alreadyReversed).toBe(true);
    expect(result.reversalId).toBe(reversal.id);
    expect(mockRepo.markAsReversedIfActive).not.toHaveBeenCalled();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("deve lançar ConflictError se for um estorno (reversalOfId setado)", async () => {
    const reversal = FinancialRecord.create({
      amount: new Decimal(50),
      method: "CASH" as any,
      date: new Date(),
      direction: "EXPENSE" as any,
      recordedById: "user-2",
      categoryId: "cat-2",
      reversalOfId: "original-1",
    });
    mockRepo.findById.mockResolvedValue(reversal);

    await expect(
      useCase.execute({ financialRecordId: reversal.id, reversedById: "user-3", reason: "test" }),
    ).rejects.toThrow(ConflictError);
  });

  it("deve lançar DataIntegrityError se reversal existe mas original não está REVERSED", async () => {
    const original = makeRecord(); // status ACTIVE
    const reversal = FinancialRecord.create({
      amount: original.amount,
      method: original.method,
      date: new Date(),
      direction: "EXPENSE" as any,
      recordedById: "user-2",
      categoryId: "cat-2",
      reversalOfId: original.id,
    });

    mockRepo.findById.mockResolvedValue(original);
    mockRepo.findByReversalOfId.mockResolvedValue(reversal);

    await expect(
      useCase.execute({ financialRecordId: original.id, reversedById: "user-2", reason: "test" }),
    ).rejects.toThrow(DataIntegrityError);
  });

  it("deve recuperar concorrência: CAS falha mas reversal existe → alreadyReversed", async () => {
    const original = makeRecord();
    const reversal = FinancialRecord.create({
      amount: original.amount,
      method: original.method,
      date: new Date(),
      direction: "EXPENSE" as any,
      recordedById: "user-2",
      categoryId: "cat-2",
      reversalOfId: original.id,
    });
    const reversedOriginal = makeRecord();
    reversedOriginal.reverse("user-2", "Concorrente");

    mockRepo.findById
      .mockResolvedValueOnce(original)   // primeira leitura
      .mockResolvedValueOnce(reversedOriginal); // re-leitura
    mockRepo.findByReversalOfId
      .mockResolvedValueOnce(null)       // sem reversal
      .mockResolvedValueOnce(reversal);  // agora existe (concorrente criou)
    mockRepo.markAsReversedIfActive.mockResolvedValue(false);

    const result = await useCase.execute({
      financialRecordId: original.id,
      reversedById: "user-3",
      reason: "Perdeu corrida",
    });

    expect(result.alreadyReversed).toBe(true);
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("deve capturar unique violation fora da transação e recuperar", async () => {
    const original = makeRecord();
    original.reverse("user-1", "Estorno");
    const reversal = FinancialRecord.create({
      amount: original.amount,
      method: original.method,
      date: new Date(),
      direction: "EXPENSE" as any,
      recordedById: "user-2",
      categoryId: "cat-2",
      reversalOfId: original.id,
    });

    const p2002Error = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "6.19.2", meta: { target: ["reversalOfId"] } },
    );
    uow.execute.mockRejectedValue(p2002Error);

    mockRepo.findByReversalOfId.mockResolvedValue(reversal);
    mockRepo.findById.mockResolvedValue(original);

    const result = await useCase.execute({
      financialRecordId: original.id,
      reversedById: "user-3",
      reason: "Retry após timeout",
    });

    expect(result.alreadyReversed).toBe(true);
    expect(result.reversalId).toBe(reversal.id);
  });
});
