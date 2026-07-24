import { PrismaClient } from "@prisma/client";
import { IFinancialRecordRepository } from "../../domain/repositories/IFinancialRecordRepository";
import { PrismaFinancialRecordRepository } from "../../domain/repositories/PrismaFinancialRecordRepository";

export interface FinancialRecordUnitOfWork {
  execute<T>(
    operation: (repos: { financialRecords: IFinancialRecordRepository }) => Promise<T>,
  ): Promise<T>;
}

export class PrismaFinancialRecordUnitOfWork implements FinancialRecordUnitOfWork {
  constructor(private prisma: PrismaClient) {}

  execute<T>(
    operation: (repos: { financialRecords: IFinancialRecordRepository }) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return operation({
        financialRecords: new PrismaFinancialRecordRepository(tx),
      });
    });
  }
}
