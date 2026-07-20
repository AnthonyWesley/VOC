import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";

type DetailedMinistryInput = {
  ministryId: string;
};

export type DetailedMinistryDTO = {
  id: string;
  name: string;
  description: string | null;
  leaderId: string | null;
  createdAt: Date;
  updatedAt: Date;

  members: Array<{
    id: string;
    fullName: string;
    birthDate: Date;
    phone: string | null;
    joinedAt: Date;
    status: string;
  }>;
};

export class GetMinistryDetailedUseCase {
  constructor(private readonly repo: IMinistryRepository) {}

  async execute(
    input: DetailedMinistryInput,
  ): Promise<DetailedMinistryDTO | null> {
    const ministry = await this.repo.findDetailedMinistry(input.ministryId);
    if (!ministry) return null;

    return {
      id: ministry.id,
      name: ministry.name,
      description: ministry.description,
      leaderId: ministry.leaderId ?? null,
      createdAt: ministry.createdAt,
      updatedAt: ministry.updatedAt,

      members: ministry.members.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        birthDate: m.birthDate,
        phone: m.phone,
        joinedAt: m.joinedAt,
        status: m.status,
      })),
    };
  }
}
