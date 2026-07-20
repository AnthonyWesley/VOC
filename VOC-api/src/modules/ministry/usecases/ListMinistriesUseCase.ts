import { PrismaClient } from "@prisma/client";

export type ListMinistriesOutput = {
  id: string;
  name: string;
  description?: string | null;
  leaderId: string | null;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export class ListMinistriesUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(): Promise<ListMinistriesOutput[]> {
    const ministries = await this.prisma.ministry.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true } },
      },
    });

    return ministries.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      leaderId: m.leaderId ?? null,
      memberCount: m._count.members,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }
}
