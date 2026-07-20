import { ForbiddenError } from "../../../../shared/errors/ForbiddenError";
import { UnauthorizedError } from "../../../../shared/errors/UnauthorizedError";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { validatePasswordPolicy } from "../../../../shared/utils/validatePasswordPolicy";
import { normalizeEmail } from "../../../../shared/utils/normalizeEmail";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IHashProvider } from "../../domain/services/IHashProvider";
import { Email } from "../../domain/value-objects/Email";

export type UpdatePasswordInput = {
  email: string;
  currentPassword: string;
  newPassword: string;
};

export class UpdatePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(input: UpdatePasswordInput): Promise<void> {
    if (!input.email) {
      throw new ValidationError("MISSING_EMAIL");
    }

    if (!input.currentPassword || !input.newPassword) {
      throw new ValidationError("MISSING_PASSWORD_FIELDS");
    }

    validatePasswordPolicy(input.newPassword);

    const email = Email.create(input.email);
    const user = await this.userRepository.findByEmail(email.getValue());

    if (!user) {
      throw new UnauthorizedError("INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      throw new ForbiddenError("USER_INACTIVE");
    }

    const isCurrentPasswordValid = await this.hashProvider.compare(
      input.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError("INVALID_CURRENT_PASSWORD");
    }

    const newPasswordHash = await this.hashProvider.hash(input.newPassword);

    user.updatePassword(newPasswordHash);
    user.markPasswordAsPermanent();

    await this.userRepository.save(user);
  }
}
