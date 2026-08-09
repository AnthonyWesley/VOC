import { Prisma } from "@prisma/client";
import { EventTransactionContext } from "../../domain/transactions/EventTransactionContext";
import { PrismaEventRepository } from "../../domain/repositories/PrismaEventRepository";
import { PrismaEventAssignmentRepository } from "../repositories/PrismaEventAssignmentRepository";
import { PrismaNotificationRepository } from "../../../notification/domain/repositories/PrismaNotificationRepository";
import { PrismaCategoryRepository } from "../../../category/domain/repositories/PrismaCategoryRepository";
import { PrismaMinistryRepository } from "../../../ministry/domain/repositories/PrismaMinistryRepository";

export function createEventTransactionContext(
  tx: Prisma.TransactionClient,
): EventTransactionContext {
  return {
    eventRepository: new PrismaEventRepository(tx),
    assignmentRepository: new PrismaEventAssignmentRepository(tx),
    notificationRepository: new PrismaNotificationRepository(tx),
    categoryReader: new PrismaCategoryRepository(tx),
    ministryReader: new PrismaMinistryRepository(tx),
  };
}
