import { PrismaClient } from "@prisma/client";
import { IMemberCriticalSection } from "../../domain/transactions/IMemberCriticalSection";
import { MemberTransactionContext } from "../../domain/transactions/MemberTransactionContext";
import { createMemberTransactionContext } from "./createMemberTransactionContext";

const MEMBER_LOCK_NAMESPACE = 10_032_743;

export class PrismaMemberCriticalSection implements IMemberCriticalSection {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(
    memberId: string,
    operation: (context: MemberTransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          ${MEMBER_LOCK_NAMESPACE}::int4,
          hashtext(${memberId})
        )
      `;

      return operation(createMemberTransactionContext(tx)) as unknown as T;
    }) as Promise<T>;
  }
}