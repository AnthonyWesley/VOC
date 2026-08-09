import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";
import { IMinistryCriticalSection } from "../domain/transactions/IMinistryCriticalSection";

export type RestoreMinistryInput = {
  ministryId: string;
  restoredById: string;
  reason: string;
};

export type RestoreMinistryOutput = {
  id: string;
};

export class RestoreMinistryUseCase {
  constructor(
    private readonly _repo: IMinistryRepository,
    private readonly criticalSection: IMinistryCriticalSection,
  ) {}

  async execute(input: RestoreMinistryInput): Promise<RestoreMinistryOutput> {
    if (!input.reason || input.reason.trim().length < 3) {
      throw new ValidationError("RESTORE_REASON_REQUIRED");
    }

    return this.criticalSection.execute(input.ministryId, async (ctx) => {
      const ministry = await ctx.ministryRepository.findByIdIncludingDeleted(input.ministryId);
      if (!ministry) throw new NotFoundError("MINISTRY_NOT_FOUND");
      if (!ministry.isDeleted) throw new ConflictError("MINISTRY_NOT_DELETED");

      const changes = {
        deletedAt: { before: ministry.deletedAt, after: null },
      };

      ministry.restore();
      await ctx.ministryRepository.save(ministry);
      await ctx.restoreLogRepository.create({
        ministryId: ministry.id,
        restoredById: input.restoredById,
        reason: input.reason.trim(),
        changes,
      });

      return { id: ministry.id };
    });
  }
}