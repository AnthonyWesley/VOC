import { TransactionDirection } from "@prisma/client";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IFinancialRecordRepository } from "../domain/repositories/IFinancialRecordRepository";

export type GetFinancialRecordInput = {
  recordId: string;
};

export type GetFinancialRecordDetailedOutput = {
  id: string;
  amount: number;
  method: string;
  date: Date;
  description: string | null;
  direction: TransactionDirection;
  status: string;

  category: { id: string; name: string; type: TransactionDirection } | null;
  member: { id: string; fullName: string } | null;
  event: { id: string; title: string | null } | null;

  recordedBy: {
    userId: string;
    fullName: string | null;
    memberId: string | null;
    roleName: string | null;
  };

  audit: {
    createdAt: Date;
    updatedAt: Date;
    cancelledAt: Date | null;
    cancelledById: string | null;
    cancelReason: string | null;
  };

  reversalOf: { id: string } | null;
  reversedBy: { id: string } | null;
};

export class GetFinancialRecordByIdUseCase {
  constructor(private readonly repo: IFinancialRecordRepository) {}

  async execute(
    input: GetFinancialRecordInput,
  ): Promise<GetFinancialRecordDetailedOutput> {
    if (!input.recordId) {
      throw new ValidationError("MISSING_RECORD_ID");
    }

    const record = await this.repo.findByIdDetailed(input.recordId);

    if (!record) {
      throw new ValidationError("FINANCIAL_RECORD_NOT_FOUND");
    }

    return record;
  }
}
