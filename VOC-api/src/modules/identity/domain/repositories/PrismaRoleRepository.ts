// identity/infra/repositories/PrismaUserRepository.ts

import { PrismaClient } from "@prisma/client";
import { Role } from "../entities/Role";
import { IRoleRepository } from "./IRoleRepository";

export class PrismaRoleRepository implements IRoleRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<Role[]> {
    const data = await this.prisma.role.findMany({
      where: { NOT: { name: "PRESIDENT" } },
      orderBy: { level: "desc" },
    });

    return data.map((role) =>
      Role.create({
        id: role.id,
        name: role.name,
        level: role.level,
        description: role.description ?? "",
      }),
    );
  }

  async findById(id: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) return null;

    return Role.create({
      id: role.id,
      name: role.name,
      level: role.level,
      description: role.description ?? "",
    });
  }

  async findByName(name: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
    });

    if (!role) return null;

    return Role.create({
      id: role.id,
      name: role.name,
      level: role.level,
      description: role.description ?? "",
    });
  }
}
