import { ConflictError } from "../../../../shared/errors/ConflictError";
import { NotFoundError } from "../../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { Email } from "../../domain/value-objects/Email";

export type UpdateUserInput = {
  userId: string;
  email?: string;
};

export type UpdateUserOutput = {
  id: string;
  email: string;
};

export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserInput): Promise<UpdateUserOutput> {
    const { userId, email } = input;

    if (!userId) {
      throw new ValidationError("MISSING_USER_ID");
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("USER_NOT_FOUND");
    }

    if (email) {
      const emailVO = Email.create(email);

      const existing = await this.userRepository.findByEmail(
        emailVO.getValue(),
      );
      if (existing && existing.id !== user.id) {
        throw new ConflictError("EMAIL_ALREADY_IN_USE");
      }

      user.updateEmail(emailVO);
    }

    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email,
    };
  }
}
