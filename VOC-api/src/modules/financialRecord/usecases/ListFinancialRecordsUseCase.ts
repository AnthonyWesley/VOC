import { PaymentMethod, TransactionDirection } from "@prisma/client";
import { IFinancialRecordRepository } from "../domain/repositories/IFinancialRecordRepository";
import { Decimal } from "@prisma/client/runtime/library";

export type FinancialRecordListDTO = {
  id: string;
  amount: Decimal;
  method: PaymentMethod;
  date: Date;
  direction: TransactionDirection;
  status: string;
  category: { id: string; name: string; type: TransactionDirection } | null;
  recordedBy: { id: string | null; fullName: string | null };
  createdAt: Date;
  cancelledAt: Date | null;
};

export class ListFinancialRecordsUseCase {
  constructor(private readonly repo: IFinancialRecordRepository) {}

  async execute(params?: { limit?: number; offset?: number; includeCancelled?: boolean }): Promise<FinancialRecordListDTO[]> {
    const records = await this.repo.findAll(params);

    return records.map((r) => ({ ...r }));
  }
}
