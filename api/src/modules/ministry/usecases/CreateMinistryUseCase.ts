import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";

import { Ministry } from "../domain/entities/Ministry";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { isPrismaUniqueViolation } from "../../../shared/utils/isPrismaUniqueViolation";
import { createLogger } from "../../../shared/logger/logger";

const logger = createLogger("create-ministry");

export type CreateMinistryInput = {
  name: string;
  description?: string | null;
};

export type CreateMinistryOutput = {
  id: string;
};

export class CreateMinistryUseCase {
  constructor(private readonly ministryRepository: IMinistryRepository) {}

  async execute(input: CreateMinistryInput): Promise<CreateMinistryOutput> {
    const { name, description } = input;

    const existing = await this.ministryRepository.findByNameIncludingDeleted(name);
    if (existing?.isDeleted) {
      throw new ConflictError(
        "MINISTRY_REACTIVATION_REQUIRED",
        undefined,
        "Este ministério foi removido e precisa de restauração explícita.",
      );
    }

    const ministry = Ministry.create({
      description: description ?? undefined,
      name,
    });

    try {
      await this.ministryRepository.save(ministry);
    } catch (error: unknown) {
      if (isPrismaUniqueViolation(error)) {
        await this.throwNameConflictAfterReRead(name, error);
      }
      throw error;
    }

    return {
      id: ministry.id,
    };
  }

  private async throwNameConflictAfterReRead(name: string, error: unknown): Promise<never> {
    logger.warn({ name, error }, "Duplicate ministry name");

    const afterRollback = await this.ministryRepository.findByNameIncludingDeleted(name);

    if (!afterRollback) {
      throw error;
    }

    if (afterRollback.isDeleted) {
      throw new ConflictError(
        "MINISTRY_REACTIVATION_REQUIRED",
        undefined,
        "Este ministério foi removido e precisa de restauração explícita.",
      );
    }

    throw new ConflictError("MINISTRY_NAME_CONFLICT", undefined, "Já existe um ministério com este nome");
  }
}