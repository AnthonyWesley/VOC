import { ForbiddenError } from "../../../../shared/errors/ForbiddenError";
import { NotFoundError } from "../../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export type DeactivateUserInput = {
  userId: string;
  assignedById: string;
};

export type DeactivateUserOutput = {
  id: string;
};

export class DeactivateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: DeactivateUserInput): Promise<DeactivateUserOutput> {
    const { userId, assignedById } = input;

    if (!userId) {
      throw new ValidationError("MISSING_USER_ID");
    }

    if (!assignedById) {
      throw new ValidationError("MISSING_ASSIGNED_BY_ID");
    }

    const assignedBy = await this.userRepository.findById(assignedById);

    if (!assignedBy) {
      throw new NotFoundError("ASSIGNED_BY_NOT_FOUND");
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("USER_NOT_FOUND");
    }

    if (!user.isActive) {
      throw new ForbiddenError("USER_ALREADY_INACTIVE");
    }

    user.deactivate();
    await this.userRepository.save(user);

    return { id: user.id };
  }
}
