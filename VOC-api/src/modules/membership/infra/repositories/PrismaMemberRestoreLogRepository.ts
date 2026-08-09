import { Prisma } from "@prisma/client";
import { PrismaDatabaseClient } from "../../../../shared/infra/PrismaDatabaseClient";
import { generateId } from "../../../../shared/utils/generateId";
import {
  CreateMemberRestoreLogInput,
  IMemberRestoreLogRepository,
} from "../../domain/repositories/IMemberRestoreLogRepository";

export class PrismaMemberRestoreLogRepository implements IMemberRestoreLogRepository {
  constructor(private readonly db: PrismaDatabaseClient) {}

  async create(input: CreateMemberRestoreLogInput): Promise<void> {
    await this.db.memberRestoreLog.create({
      data: {
        id: generateId(),
        memberId: input.memberId,
        restoredById: input.restoredById,
        reason: input.reason.trim(),
        changes: input.changes as Prisma.InputJsonValue,
      },
    });
  }
}