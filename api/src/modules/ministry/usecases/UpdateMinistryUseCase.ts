import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";
import { isPrismaUniqueViolation } from "../../../shared/utils/isPrismaUniqueViolation";
import { createLogger } from "../../../shared/logger/logger";

const logger = createLogger("update-ministry");

export type UpdateMinistryInput = {
  ministryId: string;
  name?: string;
  description?: string | null;
};

export type UpdateMinistryOutput = {
  id: string;
};

export class UpdateMinistryUseCase {
  constructor(private readonly ministryRepository: IMinistryRepository) {}

  async execute(input: UpdateMinistryInput): Promise<UpdateMinistryOutput> {
    const { ministryId, name, description } = input;

    if (!ministryId) {
      throw new ValidationError("MISSING_MINISTRY_ID");
    }

    const ministry = await this.ministryRepository.findById(ministryId);

    if (!ministry) {
      throw new NotFoundError("MINISTRY_NOT_FOUND");
    }

    ministry.update({ name, description });

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

  private async throwNameConflictAfterReRead(name: string | undefined, error: unknown): Promise<never> {
    logger.warn({ name, error }, "Duplicate ministry name on update");

    if (name === undefined) {
      throw error;
    }

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