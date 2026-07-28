import { PrismaClient } from "@prisma/client";
import {
  IMinistryMembershipTransaction,
  MinistryMembershipTransactionRepositories,
} from "../../domain/transactions/IMinistryMembershipTransaction";
import { PrismaMinistryMembershipRepository } from "../repositories/PrismaMinistryMembershipRepository";
import { PrismaNotificationRepository } from "../../../notification/domain/repositories/PrismaNotificationRepository";

export class PrismaMinistryMembershipTransaction implements IMinistryMembershipTransaction {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(
    callback: (repositories: MinistryMembershipTransactionRepositories) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return callback({
        memberships: new PrismaMinistryMembershipRepository(tx),
        notifications: new PrismaNotificationRepository(tx),
      });
    });
  }
}
