// src/usecases/ListUsersUseCase.ts
export type RoleProps = {
  id: string;
  name: string;
  level: number;
};

export type ListUsersOutput = {
  userId: string;
  memberId: string | null;
  email: string;
  fullName: string | null;
  photoUrl?: string | null;
  phone?: string | null;
  isActive: boolean;
  roles: RoleProps[];
  birthDate: Date | null;
  baptismDate: Date | null;
  createdAt: Date;
};

export type ListUsersInput = {
  limit: number;
  cursor?: string;
  search?: string;
  isActive?: boolean;
};

export type PaginatedUsersOutput = {
  data: ListUsersOutput[];
  nextCursor: string | null;
};

export class ListUsersUseCase {
  constructor(private readonly repo: { findAll: Function }) {}

  async execute(input: ListUsersInput): Promise<PaginatedUsersOutput> {
    const { users, nextCursor } = await this.repo.findAll(input);
    return { data: users, nextCursor };
  }
}
