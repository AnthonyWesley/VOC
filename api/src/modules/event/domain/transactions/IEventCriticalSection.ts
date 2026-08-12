import { EventTransactionContext } from "./EventTransactionContext";

export interface IEventCriticalSection {
  execute<T>(
    eventId: string,
    operation: (context: EventTransactionContext) => Promise<T>,
  ): Promise<T>;
}
