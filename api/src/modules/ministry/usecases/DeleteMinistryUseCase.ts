import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";
import { IMinistryCriticalSection } from "../domain/transactions/IMinistryCriticalSection";
import { NotFoundError } from "../../../shared/errors/NotFoundError";

export type DeleteMinistryInput = {
  ministryId: string;
};

export class DeleteMinistryUseCase {
  constructor(
    private readonly _repo: IMinistryRepository,
    private readonly criticalSection: IMinistryCriticalSection,
  ) {}

  async execute(input: DeleteMinistryInput): Promise<void> {
    await this.criticalSection.execute(input.ministryId, async (ctx) => {
      const ministry = await ctx.ministryRepository.findByIdIncludingDeleted(input.ministryId);

      if (!ministry) {
        throw new NotFoundError("MINISTRY_NOT_FOUND");
      }

      if (ministry.isDeleted) {
        return;
      }

      ministry.delete();
      await ctx.ministryRepository.save(ministry);
    });
  }
}