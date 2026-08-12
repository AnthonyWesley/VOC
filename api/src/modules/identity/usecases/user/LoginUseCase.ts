import { ForbiddenError } from "../../../../shared/errors/ForbiddenError";
import { UnauthorizedError } from "../../../../shared/errors/UnauthorizedError";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { RefreshToken } from "../../../refreshToken/domain/entities/RefreshToken";
import { IRefreshTokenRepository } from "../../../refreshToken/domain/repositories/IRefreshTokenRepository";
import { RoleProps } from "../../domain/entities/Role";
import { UserRole } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IHashProvider } from "../../domain/services/IHashProvider";
import { IJwtProvider } from "../../domain/services/IJwtProvider";
import { Email } from "../../domain/value-objects/Email";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginOutput = {
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
  roles: UserRole[];
};

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashProvider: IHashProvider,
    private readonly jwtProvider: IJwtProvider,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const email = Email.create(input.email); // garante VO

    if (!input.password) {
      throw new ValidationError("INVALID_PASSWORD");
    }

    const user = await this.userRepository.findByEmail(email.getValue());

    if (!user) {
      throw new UnauthorizedError("INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      throw new ForbiddenError("USER_INACTIVE");
    }

    const isPasswordValid = await this.hashProvider.compare(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("INVALID_CREDENTIALS");
    }

    // Se for senha temporária, verifica expiração e impede o login
    if (user.isTemporaryPassword) {
      if (
        !user.temporaryPasswordExpiresAt ||
        user.temporaryPasswordExpiresAt <= new Date()
      ) {
        throw new ForbiddenError("TEMPORARY_PASSWORD_EXPIRED");
      }
      throw new ForbiddenError("TEMPORARY_PASSWORD_REQUIRED");
    }

    const token = this.jwtProvider.signAccessToken(
      { userId: user.id, roles: user.roles, userLevel: user.highestLevel },
      "1d",
    );

    const refreshToken = this.jwtProvider.signRefreshToken(
      { userId: user.id, roles: user.roles, userLevel: user.highestLevel },
      "7d",
    );

    const refreshTokenHash = await this.hashProvider.hash(refreshToken);

    const refreshTokenEntity = RefreshToken.create(
      user.id,
      refreshTokenHash,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      token,
      refreshToken, // necessário
      userId: user.id,
      email: user.email,
      roles: user.roles,
    };
  }
}
