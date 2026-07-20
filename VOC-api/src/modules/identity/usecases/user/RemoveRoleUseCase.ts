import { ForbiddenError } from "../../../../shared/errors/ForbiddenError";
import { NotFoundError } from "../../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { IRoleRepository } from "../../domain/repositories/IRoleRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export type RemoveRoleInput = {
  userId: string;
  roleId: string;
  removedById: string;
};

export class RemoveRoleUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(input: RemoveRoleInput): Promise<void> {
    const { userId, roleId, removedById } = input;

    // 1️⃣ Validações de entrada
    if (!userId || !roleId || !removedById) {
      throw new ValidationError("MISSING_REQUIRED_FIELDS");
    }

    // 2️⃣ Busca a Role no banco
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError("ROLE_NOT_FOUND");
    }

    // 3️⃣ Busca o usuário que está removendo a role
    const removedBy = await this.userRepository.findById(removedById);
    if (!removedBy) {
      throw new NotFoundError("REMOVED_BY_NOT_FOUND");
    }

    if (!removedBy.isActive) {
      throw new ForbiddenError("REMOVED_BY_INACTIVE");
    }

    // 4️⃣ Busca o usuário destino
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("USER_NOT_FOUND");
    }

    if (!user.isActive) {
      throw new ForbiddenError("CANNOT_REMOVE_ROLE_FROM_INACTIVE_USER");
    }

    // 5️⃣ Validação de permissão: apenas quem tem nível >= role.level pode remover
    if (removedBy.highestLevel < role.level) {
      throw new ForbiddenError("INSUFFICIENT_PERMISSION_TO_REMOVE_ROLE");
    }

    // 6️⃣ Persiste a remoção no banco (Prisma UserRole)
    await this.userRepository.removeRole(userId, roleId);
  }
}
