import { PrismaClient } from "@prisma/client";
import { IMinistryCriticalSection } from "../../domain/transactions/IMinistryCriticalSection";
import { MinistryTransactionContext } from "../../domain/transactions/MinistryTransactionContext";
import { createMinistryTransactionContext } from "./createMinistryTransactionContext";

const MINISTRY_LOCK_NAMESPACE = 10_393_210;

export class PrismaMinistryCriticalSection implements IMinistryCriticalSection {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(
    ministryId: string,
    operation: (context: MinistryTransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          ${MINISTRY_LOCK_NAMESPACE}::int4,
          hashtext(${ministryId})
        )
      `;

      return operation(createMinistryTransactionContext(tx)) as unknown as T;
    }) as Promise<T>;
  }
}