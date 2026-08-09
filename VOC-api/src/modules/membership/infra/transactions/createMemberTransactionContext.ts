import { Prisma } from "@prisma/client";
import { MemberTransactionContext } from "../../domain/transactions/MemberTransactionContext";
import { PrismaMemberRepository } from "../../domain/repositories/PrismaMemberRepository";
import { PrismaMemberRestoreLogRepository } from "../repositories/PrismaMemberRestoreLogRepository";

export function createMemberTransactionContext(
  tx: Prisma.TransactionClient,
): MemberTransactionContext {
  return {
    memberRepository: new PrismaMemberRepository(tx),
    restoreLogRepository: new PrismaMemberRestoreLogRepository(tx),
  };
}