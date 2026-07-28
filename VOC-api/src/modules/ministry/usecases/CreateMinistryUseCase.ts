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
  constructor(private readonly memberRepository: IMinistryRepository) {}

  async execute(input: CreateMinistryInput): Promise<CreateMinistryOutput> {
    const { name, description } = input;

    const ministry = Ministry.create({
      description: description ?? undefined,
      name,
    });

    try {
      await this.memberRepository.save(ministry);
    } catch (error: unknown) {
      if (isPrismaUniqueViolation(error)) {
        logger.warn({ name, error }, "Duplicate ministry name");
        throw new ConflictError("MINISTRY_NAME_CONFLICT", undefined, "Já existe um ministério com este nome");
      }
      throw error;
    }

    return {
      id: ministry.id,
    };
  }
}
