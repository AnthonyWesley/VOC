import { ValidationError } from "../../../shared/errors/ValidationError";
import { IFinancialRecordRepository } from "../domain/repositories/IFinancialRecordRepository";

export type UpdateFinancialRecordInput = {
  financialRecordId: string;
  description?: string;
  memberId?: string | null;
  eventId?: string | null;
};

export class UpdateFinancialRecordUseCase {
  constructor(private readonly repo: IFinancialRecordRepository) {}

  async execute(input: UpdateFinancialRecordInput): Promise<void> {
    if (!input.financialRecordId) throw new ValidationError("MISSING_RECORD_ID");

    const record = await this.repo.findById(input.financialRecordId);
    if (!record) throw new ValidationError("FINANCIAL_RECORD_NOT_FOUND");

    record.update({
      description: input.description ?? record.description,
      memberId: input.memberId ?? record.memberId,
      eventId: input.eventId ?? record.eventId,
    });

    await this.repo.update(record);
  }
}
