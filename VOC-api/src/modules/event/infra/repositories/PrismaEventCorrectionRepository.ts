import { PrismaDatabaseClient } from "../../../../shared/infra/PrismaDatabaseClient";
import { generateId } from "../../../../shared/utils/generateId";
import {
  CreateEventCorrectionInput,
  IEventCorrectionRepository,
} from "../../domain/repositories/IEventCorrectionRepository";

export class PrismaEventCorrectionRepository implements IEventCorrectionRepository {
  constructor(private readonly db: PrismaDatabaseClient) {}

  async create(input: CreateEventCorrectionInput): Promise<void> {
    await this.db.eventCorrection.create({
      data: {
        id: generateId(),
        eventId: input.eventId,
        correctedById: input.correctedById,
        reason: input.reason.trim(),
        changes: input.changes as any,
      },
    });
  }
}