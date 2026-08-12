import { PrismaClient } from "@prisma/client";
import { IEventCriticalSection } from "../../domain/transactions/IEventCriticalSection";
import { EventTransactionContext } from "../../domain/transactions/EventTransactionContext";
import { createEventTransactionContext } from "./createEventTransactionContext";

const EVENT_TERMINAL_LOCK_NAMESPACE = 10_032_742;

export class PrismaEventCriticalSection implements IEventCriticalSection {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(
    eventId: string,
    operation: (context: EventTransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          ${EVENT_TERMINAL_LOCK_NAMESPACE}::int4,
          hashtext(${eventId})
        )
      `;

      return operation(createEventTransactionContext(tx)) as unknown as T;
    }) as Promise<T>;
  }
}
