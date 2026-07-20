import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";
import { NotFoundError } from "../../../shared/errors/NotFoundError";

export type DeleteMinistryInput = {
  ministryId: string;
};

export class DeleteMinistryUseCase {
  constructor(private readonly ministryRepository: IMinistryRepository) {}

  async execute(input: DeleteMinistryInput): Promise<void> {
    const ministry = await this.ministryRepository.findById(input.ministryId);

    if (!ministry) {
      throw new NotFoundError("Ministry not found");
    }

    await this.ministryRepository.delete(input.ministryId);
  }
}