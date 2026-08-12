import { Prisma } from "@prisma/client";
import { MinistryTransactionContext } from "../../domain/transactions/MinistryTransactionContext";
import { PrismaMinistryRepository } from "../../domain/repositories/PrismaMinistryRepository";
import { PrismaMinistryRestoreLogRepository } from "../repositories/PrismaMinistryRestoreLogRepository";

export function createMinistryTransactionContext(
  tx: Prisma.TransactionClient,
): MinistryTransactionContext {
  return {
    ministryRepository: new PrismaMinistryRepository(tx),
    restoreLogRepository: new PrismaMinistryRestoreLogRepository(tx),
  };
}