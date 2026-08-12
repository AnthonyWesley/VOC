import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";

export type ListMinistriesOutput = {
  id: string;
  name: string;
  description?: string | null;
  leaderId: string | null;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export class ListMinistriesUseCase {
  constructor(private readonly ministryRepository: IMinistryRepository) {}

  async execute(): Promise<ListMinistriesOutput[]> {
    return this.ministryRepository.findAllWithDetails();
  }
}
