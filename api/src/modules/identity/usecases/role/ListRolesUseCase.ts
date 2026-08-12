// identity/use-cases/ListRolesUseCase.ts

import { IRoleRepository } from "../../domain/repositories/IRoleRepository";

type ListRoleDTO = {
  id: string;
  name: string;
  level: number;
  description: string;
};

export class ListRolesUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(): Promise<ListRoleDTO[]> {
    const roles = await this.roleRepository.findAll();

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      level: role.level,
      description: role.description,
    }));
  }
}
