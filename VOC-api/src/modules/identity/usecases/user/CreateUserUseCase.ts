import { randomBytes } from "crypto";
import { ConflictError } from "../../../../shared/errors/ConflictError";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { User } from "../../domain/entities/User";
import { IRoleRepository } from "../../domain/repositories/IRoleRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IHashProvider } from "../../domain/services/IHashProvider";
import { Email } from "../../domain/value-objects/Email";

const TEMP_PASSWORD_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

export type CreateUserInput = {
  email: string;
  password?: string;
};

export type CreateUserOutput = {
  id: string;
  email: string;
  temporaryPassword: string;
};

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashProvider: IHashProvider,
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const { email } = input;

    if (!email) {
      throw new ValidationError("MISSING_EMAIL");
    }

    const emailVO = Email.create(email);

    const existingUser = await this.userRepository.findByEmail(
      emailVO.getValue(),
    );

    if (existingUser) {
      throw new ConflictError("USER_ALREADY_EXISTS");
    }

    const temporaryPassword = randomBytes(12).toString("base64url");

    const passwordHash = await this.hashProvider.hash(temporaryPassword);

    const user = User.create({
      email: emailVO,
      passwordHash,
      temporaryPasswordExpiresAt: new Date(Date.now() + TEMP_PASSWORD_TTL_MS),
    });

    await this.userRepository.save(user);

    // Atribui role MEMBER automaticamente para o usuário ter acesso básico
    const memberRole = await this.roleRepository.findByName("MEMBER");
    if (memberRole) {
      await this.userRepository.assignRole(user.id, memberRole.id);
    }

    return {
      id: user.id,
      email: user.email,
      temporaryPassword,
    };
  }
}
