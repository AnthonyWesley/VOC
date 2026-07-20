import { Decimal } from "@prisma/client/runtime/library";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { FinancialRecord } from "../domain/entities/FinancialRecord";
import { IFinancialRecordRepository } from "../domain/repositories/IFinancialRecordRepository";

export type ReverseFinancialRecordInput = {
  financialRecordId: string;
  cancelledById: string;
  categoryId: string;
  reason?: string;
};

export class ReverseFinancialRecordUseCase {
  constructor(private readonly repo: IFinancialRecordRepository) {}

  async execute(input: ReverseFinancialRecordInput) {
    const original = await this.repo.findById(input.financialRecordId);

    if (!original) {
      throw new ValidationError("FINANCIAL_RECORD_NOT_FOUND");
    }

    if (original.isCancelled) {
      throw new ValidationError("FINANCIAL_RECORD_ALREADY_CANCELLED");
    }

    // Cancela o registro original
    original.cancel(input.cancelledById, input.reason);
    await this.repo.save(original);

    // Cria o registro de estorno espelhado
    const reversal = FinancialRecord.create({
      amount: original.amount,
      method: original.method,
      date: new Date(),
      recordedById: input.cancelledById,
      categoryId: input.categoryId,
      description: `Estorno: ${original.description ?? "sem descrição"}`,
      memberId: original.memberId ?? undefined,
      eventId: original.eventId ?? undefined,
      reversalOfId: original.id,
    });

    await this.repo.create(reversal);

    return {
      originalId: original.id,
      reversalId: reversal.id,
      status: "CANCELLED_AND_REVERSED",
    };
  }
}
