import { IFinancialRecordRepository } from "../domain/repositories/IFinancialRecordRepository";
import { FinancialRecord } from "../domain/entities/FinancialRecord";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { PaymentMethod } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export type CreateFinancialRecordInput = {
  amount: Decimal;
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
  constructor(private readonly repo: IFinancialRecordRepository) {}

  async execute(
    input: CreateFinancialRecordInput,
  ): Promise<CreateFinancialRecordOutput> {
    if (input.amount === undefined || input.amount === null)
      throw new ValidationError("MISSING_AMOUNT");

    // Agora amount é number, então validamos como number
    if (typeof input.amount !== "number" || input.amount <= 0)
      throw new ValidationError("INVALID_AMOUNT");

    if (!input.method) throw new ValidationError("MISSING_METHOD");
    if (!input.date) throw new ValidationError("MISSING_DATE");
    if (!input.recordedById) throw new ValidationError("MISSING_RECORDED_BY");

    const record = FinancialRecord.create({
      amount: new Decimal(input.amount), // aqui sim vira Decimal
      method: input.method,
      date: input.date,
      recordedById: input.recordedById,

      description: input.description,
      categoryId: input.categoryId,
      memberId: input.memberId ?? undefined,
      eventId: input.eventId ?? undefined,
    });

    await this.repo.save(record);

    return { id: record.id };
  }
}
