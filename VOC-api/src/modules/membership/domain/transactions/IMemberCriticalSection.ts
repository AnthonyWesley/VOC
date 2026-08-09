import { MemberTransactionContext } from "./MemberTransactionContext";

export interface IMemberCriticalSection {
  execute<T>(
    memberId: string,
    operation: (context: MemberTransactionContext) => Promise<T>,
  ): Promise<T>;
}