import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";

export type UpdateMinistryInput = {
  ministryId: string;
  name?: string;
  description?: string;
};

export type UpdateMinistryOutput = {
  id: string;
};

export class UpdateMinistryUseCase {
  constructor(private readonly ministryRepository: IMinistryRepository) {}

  async execute(input: UpdateMinistryInput): Promise<UpdateMinistryOutput> {
    const { ministryId } = input;

    if (!ministryId) {
      throw new ValidationError("MISSING_MINISTRY_ID");
    }

    const ministry = await this.ministryRepository.findById(ministryId);

    if (!ministry) {
      throw new NotFoundError("MINISTRY_NOT_FOUND");
    }

    await this.ministryRepository.save(ministry);

    return {
      id: ministry.id,
    };
  }
}
