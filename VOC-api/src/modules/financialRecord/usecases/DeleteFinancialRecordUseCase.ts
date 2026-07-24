import { ConflictError } from "../../../shared/errors/ConflictError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IFinancialRecordRepository } from "../domain/repositories/IFinancialRecordRepository";

export type DeleteFinancialRecordInput = {
  financialRecordId: string;
  deletedById: string;
  reason?: string;
};

export class DeleteFinancialRecordUseCase {
  constructor(private readonly repo: IFinancialRecordRepository) {}

  async execute(input: DeleteFinancialRecordInput) {
    const record = await this.repo.findById(input.financialRecordId);
    if (!record) throw new ValidationError("FINANCIAL_RECORD_NOT_FOUND");

    record.cancel(input.deletedById, input.reason);

    const cancelled = await this.repo.markAsCancelledIfActive({
      id: record.id,
      cancelledAt: record.cancelledAt!,
      cancelledById: record.cancelledById!,
      cancelReason: record.cancelReason,
    });

    if (!cancelled) {
      const current = await this.repo.findById(input.financialRecordId);
      if (current?.isCancelled) throw new ConflictError("FINANCIAL_RECORD_ALREADY_CANCELLED");
      if (current?.isReversed) throw new ConflictError("CANNOT_CANCEL_REVERSED");
      if (current?.isReversal) throw new ConflictError("CANNOT_CANCEL_REVERSAL");
      throw new ConflictError("FINANCIAL_RECORD_STATE_CHANGED");
    }
  }
}
