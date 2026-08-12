import { PrismaClient } from "@prisma/client";
import { IRefreshTokenRepository } from "./IRefreshTokenRepository";
import { RefreshToken } from "../entities/RefreshToken";

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(token: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      },
    });
  }

  async findByTokenHash(hash: string): Promise<RefreshToken | null> {
    const data = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
    });

    if (!data) return null;

    return RefreshToken.rehydrate({
      id: data.id,
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
    });
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const data = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) =>
      RefreshToken.rehydrate({
        id: item.id,
        userId: item.userId,
        tokenHash: item.tokenHash,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
      }),
    );
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { id },
    });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
