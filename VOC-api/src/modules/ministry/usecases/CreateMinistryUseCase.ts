import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";

import { Ministry } from "../domain/entities/Ministry";
import { ValidationError } from "../../../shared/errors/ValidationError";

export type CreateMinistryInput = {
  name: string;
  description: string;
};

export type CreateMinistryOutput = {
  id: string;
};

export class CreateMinistryUseCase {
  constructor(private readonly memberRepository: IMinistryRepository) {}

  async execute(input: CreateMinistryInput): Promise<CreateMinistryOutput> {
    const { name, description } = input;

    if (!name) {
      throw new ValidationError("MISSING_FULL-NAME");
    }

    if (!description) {
      throw new ValidationError("MISSING_description");
    }

    const ministry = Ministry.create({
      description,
      name,
    });

    await this.memberRepository.save(ministry);

    return {
      id: ministry.id,
    };
  }
}
