import { IMemberRepository } from "../repositories/IMemberRepository";
import { IMemberRestoreLogRepository } from "../repositories/IMemberRestoreLogRepository";

export type MemberTransactionContext = {
  memberRepository: IMemberRepository;
  restoreLogRepository: IMemberRestoreLogRepository;
};