import { PrismaClient } from "@prisma/client";
import { IEventWriteTransaction } from "../../domain/transactions/IEventWriteTransaction";
import { EventTransactionContext } from "../../domain/transactions/EventTransactionContext";
import { createEventTransactionContext } from "./createEventTransactionContext";

export class PrismaEventWriteTransaction implements IEventWriteTransaction {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(
    operation: (context: EventTransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return operation(createEventTransactionContext(tx)) as unknown as T;
    }) as Promise<T>;
  }
}
