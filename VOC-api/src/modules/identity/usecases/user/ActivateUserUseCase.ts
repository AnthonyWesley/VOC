import { ForbiddenError } from "../../../../shared/errors/ForbiddenError";
import { NotFoundError } from "../../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export type ActivateUserInput = {
  userId: string;
  assignedById: string; // opcional, se quiser auditoria
};

export type ActivateUserOutput = {
  id: string;
};

export class ActivateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ActivateUserInput): Promise<ActivateUserOutput> {
    const { userId, assignedById } = input;

    if (!assignedById) {
      throw new ValidationError("MISSING_ASSIGNED_BY_ID");
    }

    if (!userId) {
      throw new ValidationError("MISSING_USER_ID");
    }

    const assignedBy = await this.userRepository.findById(assignedById);

    if (!assignedBy) {
      throw new NotFoundError("ASSIGNED_BY_NOT_FOUND");
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("USER_NOT_FOUND");
    }

    if (user.isActive) {
      throw new ForbiddenError("USER_ALREADY_ACTIVE");
    }

    user.activate();

    await this.userRepository.save(user);

    return { id: user.id };
  }
}
