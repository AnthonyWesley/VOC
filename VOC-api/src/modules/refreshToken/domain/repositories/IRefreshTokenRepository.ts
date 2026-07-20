import { RefreshToken } from "../entities/RefreshToken";

export interface IRefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;
  findByTokenHash(hash: string): Promise<RefreshToken | null>;
  findByUserId(userId: string): Promise<RefreshToken[]>;
  deleteById(id: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
