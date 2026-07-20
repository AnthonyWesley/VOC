import { ForbiddenError } from "../../../../shared/errors/ForbiddenError";
import { NotFoundError } from "../../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { IRoleRepository } from "../../domain/repositories/IRoleRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export type AssignRoleInput = {
  userId: string;
  roleId: string;
  assignedById: string;
};

export class AssignRoleUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(input: AssignRoleInput): Promise<void> {
    const { userId, roleId, assignedById } = input;

    // 1️⃣ Validações de entrada
    if (!userId || !roleId || !assignedById) {
      throw new ValidationError("MISSING_REQUIRED_FIELDS");
    }

    // 2️⃣ Busca a role no banco
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError("ROLE_NOT_FOUND");
    }

    // 3️⃣ Busca o usuário que está atribuindo a role
    const assignedBy = await this.userRepository.findById(assignedById);
    if (!assignedBy) {
      throw new NotFoundError("ASSIGNED_BY_NOT_FOUND");
    }

    if (!assignedBy.isActive) {
      throw new ForbiddenError("ASSIGNED_BY_INACTIVE");
    }

    // 4️⃣ Busca o usuário destino
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("USER_NOT_FOUND");
    }

    if (!user.isActive) {
      throw new ForbiddenError("CANNOT_ASSIGN_ROLE_TO_INACTIVE_USER");
    }

    // 5️⃣ Validação de permissão: apenas quem tem nível >= role.level pode atribuir
    if (assignedBy.highestLevel < role.level) {
      throw new ForbiddenError("INSUFFICIENT_PERMISSION_TO_ASSIGN_ROLE");
    }

    // 6️⃣ Persistência direta no banco
    await this.userRepository.assignRole(userId, roleId);
  }
}
