import { PrismaClient } from "@prisma/client";
import {
  IAssignMemberTransaction,
  AssignMemberTransactionRepositories,
} from "../../domain/transactions/IAssignMemberTransaction";
import { PrismaEventAssignmentRepository } from "../repositories/PrismaEventAssignmentRepository";
import { PrismaNotificationRepository } from "../../../notification/domain/repositories/PrismaNotificationRepository";

export class PrismaAssignMemberTransaction implements IAssignMemberTransaction {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(callback: (repos: AssignMemberTransactionRepositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return callback({
        assignments: new PrismaEventAssignmentRepository(tx),
        notifications: new PrismaNotificationRepository(tx),
      });
    });
  }
}
