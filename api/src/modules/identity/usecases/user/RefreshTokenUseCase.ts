import { ForbiddenError } from "../../../../shared/errors/ForbiddenError";
import { UnauthorizedError } from "../../../../shared/errors/UnauthorizedError";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { RefreshToken } from "../../../refreshToken/domain/entities/RefreshToken";
import { IRefreshTokenRepository } from "../../../refreshToken/domain/repositories/IRefreshTokenRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IHashProvider } from "../../domain/services/IHashProvider";
import { IJwtProvider, JwtPayload } from "../../domain/services/IJwtProvider";

export type RefreshInput = {
  refreshToken: string;
};

export type RefreshOutput = {
  token: string;
  refreshToken: string;
};

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly hashProvider: IHashProvider,
    private readonly jwtProvider: IJwtProvider,
  ) {}

  async execute(input: RefreshInput): Promise<RefreshOutput> {
    if (!input.refreshToken) {
      throw new ValidationError("INVALID_REFRESH_TOKEN");
    }

    // Verifica e decodifica o JWT do refresh token para obter o userId
    let payload: JwtPayload;
    try {
      payload = this.jwtProvider.verify(input.refreshToken);
    } catch {
      throw new UnauthorizedError("INVALID_REFRESH_TOKEN");
    }

    // Busca todos os refresh tokens do usuário
    const storedTokens = await this.refreshTokenRepository.findByUserId(
      payload.userId,
    );

    if (storedTokens.length === 0) {
      throw new UnauthorizedError("REFRESH_TOKEN_NOT_FOUND");
    }

    // Tenta encontrar um token armazenado cujo hash corresponda ao refresh token enviado
    // (bcrypt hash -> compare)
    let stored: RefreshToken | null = null;
    for (const candidate of storedTokens) {
      const isValid = await this.hashProvider.compare(
        input.refreshToken,
        candidate.tokenHash,
      );
      if (isValid) {
        stored = candidate;
        break;
      }
    }

    if (!stored) {
      throw new UnauthorizedError("INVALID_REFRESH_TOKEN");
    }

    if (stored.isExpired()) {
      throw new UnauthorizedError("REFRESH_TOKEN_EXPIRED");
    }

    const user = await this.userRepository.findById(stored.userId);

    if (!user) {
      throw new UnauthorizedError("USER_NOT_FOUND");
    }

    if (!user.isActive) {
      throw new ForbiddenError("USER_INACTIVE");
    }

    // Gera novos tokens
    const newAccessToken = this.jwtProvider.signAccessToken(
      { userId: user.id, roles: user.roles, userLevel: user.highestLevel },
      "1d",
    );

    const newRefreshToken = this.jwtProvider.signRefreshToken(
      { userId: user.id, roles: user.roles, userLevel: user.highestLevel },
      "7d",
    );

    const newRefreshTokenHash = await this.hashProvider.hash(newRefreshToken);

    const newRefreshEntity = RefreshToken.create(
      user.id,
      newRefreshTokenHash,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    // Invalida o antigo
    await this.refreshTokenRepository.deleteById(stored.id);

    // Salva o novo
    await this.refreshTokenRepository.save(newRefreshEntity);

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
