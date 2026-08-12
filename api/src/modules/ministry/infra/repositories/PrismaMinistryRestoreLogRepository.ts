import { Prisma } from "@prisma/client";
import { PrismaDatabaseClient } from "../../../../shared/infra/PrismaDatabaseClient";
import { generateId } from "../../../../shared/utils/generateId";
import {
  CreateMinistryRestoreLogInput,
  IMinistryRestoreLogRepository,
} from "../../domain/repositories/IMinistryRestoreLogRepository";

export class PrismaMinistryRestoreLogRepository implements IMinistryRestoreLogRepository {
  constructor(private readonly db: PrismaDatabaseClient) {}

  async create(input: CreateMinistryRestoreLogInput): Promise<void> {
    await this.db.ministryRestoreLog.create({
      data: {
        id: generateId(),
        ministryId: input.ministryId,
        restoredById: input.restoredById,
        reason: input.reason.trim(),
        changes: input.changes as Prisma.InputJsonValue,
      },
    });
  }
}