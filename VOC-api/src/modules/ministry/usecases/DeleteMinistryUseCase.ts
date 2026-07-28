import { PrismaClient } from "@prisma/client";
import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { createLogger } from "../../../shared/logger/logger";

const logger = createLogger("delete-ministry");

export type DeleteMinistryInput = {
  ministryId: string;
};

export class DeleteMinistryUseCase {
  constructor(
    private readonly ministryRepository: IMinistryRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(input: DeleteMinistryInput): Promise<void> {
    const ministry = await this.ministryRepository.findById(input.ministryId);

    if (!ministry) {
      throw new NotFoundError("Ministry not found");
    }

    const assignmentCount = await this.prisma.eventAssignment.count({
      where: { ministryId: input.ministryId },
    });

    if (assignmentCount > 0) {
      throw new ConflictError(
        "MINISTRY_IN_USE",
        { assignmentCount },
        "Este ministério possui escalas em eventos e não pode ser removido",
      );
    }

    try {
      await this.ministryRepository.delete(input.ministryId);
    } catch (error: unknown) {
      if ((error as any)?.code === "P2003") {
        logger.warn({ ministryId: input.ministryId, error }, "Referential integrity conflict on ministry delete");
        throw new ConflictError("MINISTRY_IN_USE", undefined, "Este ministério possui vínculos e não pode ser removido");
      }
      throw error;
    }
  }
}
