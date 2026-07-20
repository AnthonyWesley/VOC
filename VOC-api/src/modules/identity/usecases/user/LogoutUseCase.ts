import { UnauthorizedError } from "../../../../shared/errors/UnauthorizedError";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { IRefreshTokenRepository } from "../../../refreshToken/domain/repositories/IRefreshTokenRepository";
import { IHashProvider } from "../../domain/services/IHashProvider";

export type LogoutInput = {
  refreshToken: string;
};

export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    if (!input.refreshToken) {
      throw new ValidationError("INVALID_REFRESH_TOKEN");
    }

    const stored = await this.refreshTokenRepository.findByTokenHash(
      input.refreshToken,
    );

    if (!stored) {
      throw new UnauthorizedError("INVALID_REFRESH_TOKEN");
    }

    const isValid = await this.hashProvider.compare(
      input.refreshToken,
      stored.tokenHash,
    );

    if (!isValid) {
      throw new UnauthorizedError("INVALID_REFRESH_TOKEN");
    }

    await this.refreshTokenRepository.deleteById(stored.id);
  }
}
