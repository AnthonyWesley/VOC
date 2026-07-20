import { ValidationError } from "../../../shared/errors/ValidationError";
import { IFinancialRecordRepository } from "../domain/repositories/IFinancialRecordRepository";

export type UpdateFinancialRecordInput = {
  financialRecordId: string;
  categoryId?: string | null;
  memberId?: string | null;
  eventId?: string | null;
  description?: string | null;
};

/**
 * Atualiza apenas campos não críticos de um registro financeiro.
 * Campos críticos (amount, method, date) não podem ser alterados.
 */
export class UpdateFinancialRecordUseCase {
  constructor(private readonly repo: IFinancialRecordRepository) {}

  async execute(input: UpdateFinancialRecordInput): Promise<void> {
    if (!input.financialRecordId) {
      throw new ValidationError("MISSING_RECORD_ID");
    }

    const record = await this.repo.findById(input.financialRecordId);

    if (!record) {
      throw new ValidationError("FINANCIAL_RECORD_NOT_FOUND");
    }

    // Atualiza somente campos não críticos
    record.update({
      categoryId: input.categoryId ?? record.categoryId,
      memberId: input.memberId ?? record.memberId,
      eventId: input.eventId ?? record.eventId,
      description: input.description ?? record.description,
    });

    await this.repo.save(record);
  }
}
