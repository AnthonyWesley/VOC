import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateFinancialRecordUseCase } from "./CreateFinancialRecordUseCase";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";

describe("CreateFinancialRecordUseCase", () => {
  let mockRepo: any;
  let mockCategoryRepo: any;
  let useCase: CreateFinancialRecordUseCase;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
    };
    mockCategoryRepo = {
      findById: vi.fn(),
    };
    useCase = new CreateFinancialRecordUseCase(mockRepo, mockCategoryRepo);
  });

  it("deve criar registro com direction vindo da categoria", async () => {
    mockCategoryRepo.findById.mockResolvedValue({ id: "cat-1", type: "EXPENSE" });

    const result = await useCase.execute({
      amount: 100,
      method: "PIX" as any,
      date: new Date(),
      recordedById: "user-1",
      categoryId: "cat-1",
    });

    expect(result.id).toBeDefined();
    expect(mockRepo.create).toHaveBeenCalledOnce();
    const record = mockRepo.create.mock.calls[0][0];
    expect(record.direction).toBe("EXPENSE");
    expect(record.categoryId).toBe("cat-1");
  });

  it("deve lançar NotFoundError se categoria não existir", async () => {
    mockCategoryRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        amount: 100,
        method: "PIX" as any,
        date: new Date(),
        recordedById: "user-1",
        categoryId: "cat-inexistente",
      }),
    ).rejects.toThrow(NotFoundError);
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("deve lançar ValidationError se amount for inválido", async () => {
    await expect(
      useCase.execute({
        amount: 0,
        method: "PIX" as any,
        date: new Date(),
        recordedById: "user-1",
        categoryId: "cat-1",
      }),
    ).rejects.toThrow(ValidationError);
    expect(mockRepo.create).not.toHaveBeenCalled();
  });
});
