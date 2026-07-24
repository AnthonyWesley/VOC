import { IFinancialRecordRepository } from "../domain/repositories/IFinancialRecordRepository";
import { ICategoryRepository } from "../../category/domain/repositories/ICategoryRepository";
import { FinancialRecord } from "../domain/entities/FinancialRecord";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { PaymentMethod } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export type CreateFinancialRecordInput = {
  amount: number;
  method: PaymentMethod;
  date: Date;
  recordedById: string;
  categoryId: string;
  description?: string;
  memberId?: string | null;
  eventId?: string | null;
};

export type CreateFinancialRecordOutput = {
  id: string;
};

export class CreateFinancialRecordUseCase {
  constructor(
    private readonly repo: IFinancialRecordRepository,
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(input: CreateFinancialRecordInput): Promise<CreateFinancialRecordOutput> {
    if (input.amount === undefined || input.amount === null)
      throw new ValidationError("MISSING_AMOUNT");
    if (typeof input.amount !== "number" || input.amount <= 0)
      throw new ValidationError("INVALID_AMOUNT");
    if (!input.method) throw new ValidationError("MISSING_METHOD");
    if (!input.date) throw new ValidationError("MISSING_DATE");
    if (!input.recordedById) throw new ValidationError("MISSING_RECORDED_BY");

    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) throw new NotFoundError("CATEGORY_NOT_FOUND");

    const record = FinancialRecord.create({
      amount: new Decimal(input.amount),
      method: input.method,
      date: input.date,
      direction: category.type,
      recordedById: input.recordedById,
      categoryId: input.categoryId,
      description: input.description,
      memberId: input.memberId ?? undefined,
      eventId: input.eventId ?? undefined,
    });

    await this.repo.create(record);

    return { id: record.id };
  }
}
