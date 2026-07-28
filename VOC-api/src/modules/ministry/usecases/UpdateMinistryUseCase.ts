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
        logger.warn({ name, error }, "Duplicate ministry name on update");
        throw new ConflictError("MINISTRY_NAME_CONFLICT", undefined, "Já existe um ministério com este nome");
      }
      throw error;
    }

    return {
      id: ministry.id,
    };
  }
}
