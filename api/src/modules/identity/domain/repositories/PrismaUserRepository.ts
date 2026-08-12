// identity/infra/repositories/PrismaUserRepository.ts

import { IUserRepository } from "./IUserRepository";
import { User } from "../../domain/entities/User";
import { Email } from "../../domain/value-objects/Email";
import { normalizeEmail } from "../../../../shared/utils/normalizeEmail";
import { Prisma, PrismaClient } from "@prisma/client";
import { FindDetailedUseOutputDto } from "../../usecases/user/GetUserUseCase";
import { ListUsersOutput } from "../../usecases/user/ListUsersUseCase";

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  protected toEntity(raw: any): User {
    return User.rehydrate({
      id: raw.id,
      email: Email.create(raw.email),
      passwordHash: raw.passwordHash,
      photoUrl: raw.photoUrl,
      photoPublicId: raw.photoPublicId,
      isActive: raw.isActive,
      isTemporaryPassword: raw.isTemporaryPassword,
      temporaryPasswordExpiresAt: raw.temporaryPasswordExpiresAt ?? null,
      passwordChangedAt: raw.passwordChangedAt ?? null,

      roles: raw.roles.map((r: any) => ({
        id: r.role.id,
        name: r.role.name,
        level: r.role.level,
      })),

      member: raw.member,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findAuthUser(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        member: {
          include: {
            ministries: { include: { ministry: true } },
            ledMinistries: true,
          },
        },
      },
    });

    if (!data) return null;

    return this.toEntity(data);
  }

  async findById(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        member: true,
      },
    });

    if (!data) return null;

    return this.toEntity(data);
  }

  async findDetailedUser(id: string): Promise<FindDetailedUseOutputDto | null> {
    const data = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        member: {
          include: {
            ministries: {
              include: {
                ministry: true,
              },
            },
          },
        },
      },
    });

    if (!data) return null;

    return {
      userId: data.id,
      email: data.email,
      isActive: data.isActive,
      photoUrl: data.photoUrl,

      fullName: data.member?.fullName ?? null,
      birthDate: data.member?.birthDate ?? null,
      phone: data.member?.phone ?? null,
      baptismDate: data.member?.baptismDate ?? null,
      memberId: data.member?.id ?? null,

      roles: data.roles.map((r) => ({
        id: r.role.id,
        name: r.role.name,
        level: r.role.level,
      })),

      ministries:
        data.member?.ministries.map((m) => ({
          id: m.ministry.id,
          name: m.ministry.name,
          joinedAt: m.joinedAt,
        })) ?? [],

      createdAt: data.createdAt,
    };
  }

  async findAll(params: {
    limit: number;
    cursor?: string | null;
    search?: string | null;
    isActive?: boolean | null;
  }): Promise<{ users: ListUsersOutput[]; nextCursor: string | null }> {
    const { limit, cursor, search, isActive } = params;

    const where: Prisma.UserWhereInput = {};
    if (typeof isActive === "boolean") where.isActive = isActive;
    if (search) {
      const normalized = search.toLowerCase();
      where.OR = [
        { email: { contains: normalized } },
        { member: { normalizedFullName: { contains: normalized } } },
      ];
    }

    const data = await this.prisma.user.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      include: { roles: { include: { role: true } }, member: true },
    });

    let nextCursor: string | null = null;
    if (data.length > limit) {
      const nextItem = data.pop();
      nextCursor = nextItem!.id;
    }

    const users: ListUsersOutput[] = (data ?? []).map((item) => ({
      userId: item.id,
      email: item.email,
      isActive: item.isActive,
      photoUrl: item.photoUrl ?? null,
      fullName: item.member?.fullName ?? null,
      birthDate: item.member?.birthDate ?? null,
      phone: item.member?.phone ?? null,
      baptismDate: item.member?.baptismDate ?? null,
      memberId: item.member?.id ?? null,
      createdAt: item.createdAt,
      roles: item.roles.map((r) => ({
        id: r.role.id,
        name: r.role.name,
        level: r.role.level,
      })),
    }));

    return { users, nextCursor };
  }
  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        passwordHash: user.passwordHash,
        isActive: user.isActive,
        isTemporaryPassword: user.isTemporaryPassword,
        temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt,
        passwordChangedAt: user.passwordChangedAt,
      },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        isActive: user.isActive,
        isTemporaryPassword: user.isTemporaryPassword,
        temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt,
        passwordChangedAt: user.passwordChangedAt,
      },
    });
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = normalizeEmail(email);
    const data = await this.prisma.user.findUnique({
      where: { email: normalized },
      include: {
        roles: {
          include: { role: true },
        },
        member: true,
      },
    });

    if (!data) return null;

    return this.toEntity(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
