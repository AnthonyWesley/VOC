import { Prisma } from "@prisma/client";
import { EventTransactionContext } from "../../domain/transactions/EventTransactionContext";
import { PrismaEventRepository } from "../../domain/repositories/PrismaEventRepository";
import { PrismaEventAssignmentRepository } from "../repositories/PrismaEventAssignmentRepository";
import { PrismaEventCorrectionRepository } from "../repositories/PrismaEventCorrectionRepository";
import { PrismaNotificationRepository } from "../../../notification/domain/repositories/PrismaNotificationRepository";
import { PrismaCategoryRepository } from "../../../category/domain/repositories/PrismaCategoryRepository";
import { PrismaMinistryRepository } from "../../../ministry/domain/repositories/PrismaMinistryRepository";
import { PrismaMemberRepository } from "../../../membership/domain/repositories/PrismaMemberRepository";

export function createEventTransactionContext(
  tx: Prisma.TransactionClient,
): EventTransactionContext {
  return {
    eventRepository: new PrismaEventRepository(tx),
    assignmentRepository: new PrismaEventAssignmentRepository(tx),
    correctionRepository: new PrismaEventCorrectionRepository(tx),
    notificationRepository: new PrismaNotificationRepository(tx),
    categoryReader: new PrismaCategoryRepository(tx),
    ministryReader: new PrismaMinistryRepository(tx),
    memberReader: new PrismaMemberRepository(tx),
  };
}
