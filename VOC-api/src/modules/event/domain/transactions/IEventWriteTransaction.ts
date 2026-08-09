import { EventTransactionContext } from "./EventTransactionContext";

export interface IEventWriteTransaction {
  execute<T>(
    operation: (context: EventTransactionContext) => Promise<T>,
  ): Promise<T>;
}
