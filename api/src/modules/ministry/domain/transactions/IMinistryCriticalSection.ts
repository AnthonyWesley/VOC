import { MinistryTransactionContext } from "./MinistryTransactionContext";

export interface IMinistryCriticalSection {
  execute<T>(
    ministryId: string,
    operation: (context: MinistryTransactionContext) => Promise<T>,
  ): Promise<T>;
}