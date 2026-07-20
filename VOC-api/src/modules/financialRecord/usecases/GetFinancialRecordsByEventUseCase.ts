import { TransactionDirection } from "@prisma/client";
import { IFinancialRecordRepository } from "../domain/repositories/IFinancialRecordRepository";
import { CategoryProps } from "../../category/domain/entities/Category";

export type FinancialRecordsByEventInput = {
  eventId: string;
};

export interface EventFinancialDTO {
  financialRecords: Array<{
    id: string;
    category: CategoryProps;
    direction: TransactionDirection;
    amount: number;
    method: string;
    date: Date;
    member: {
      id: string;
      fullName: string;
      photoUrl?: string;
    };
    recordedBy: {
      fullName: string | null;
      email: string;
      roleName: string | null;
    };
  }>;

  financialSummary: {
    income: number;
    expense: number;
    balance: number;
  };
}

export class GetFinancialRecordsByEventUseCase {
  constructor(private readonly financialRepo: IFinancialRecordRepository) {}

  async execute(
    input: FinancialRecordsByEventInput,
  ): Promise<EventFinancialDTO> {
    const records = await this.financialRepo.getFinancialRecordsByEventId(
      input.eventId,
    );

    const income = records
      .filter((fr) => fr.category?.type === "INCOME")
      .reduce((sum, fr) => sum + fr.amount.toNumber(), 0);

    const expense = records
      .filter((fr) => fr.category?.type === "EXPENSE")
      .reduce((sum, fr) => sum + fr.amount.toNumber(), 0);

    const balance = income - expense;

    return {
      financialRecords: records.map((fr) => ({
        id: fr.id,
        category: fr.category,
        direction: fr.category?.type,
        amount: fr.amount.toNumber(),
        method: fr.method,
        date: fr.date,
        member: {
          id: fr.member?.id ?? null,
          fullName: fr.member?.fullName ?? null,
          photoUrl: fr.member?.photoUrl ?? null,
        },
        recordedBy: fr.recordedBy,
      })),

      financialSummary: {
        income,
        expense,
        balance,
      },
    };
  }
}
