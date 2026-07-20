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

    if (!record) {
      throw new ValidationError("FINANCIAL_RECORD_NOT_FOUND");
    }

    if (record.isCancelled) {
      throw new ValidationError("FINANCIAL_RECORD_ALREADY_CANCELLED");
    }

    record.cancel(input.deletedById, input.reason);

    await this.repo.save(record);
  }
}
