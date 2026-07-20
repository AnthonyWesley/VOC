// src/modules/finance/infra/repositories/PrismaCategoryRepository.ts
import { Prisma, PrismaClient, TransactionDirection } from "@prisma/client";
import { ICategoryRepository } from "./ICategoryRepository";
import { Category } from "../entities/Category";

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Category | null> {
    const record = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!record) return null;

    return this.mapPrismaToDomain(record);
  }

  async findAll(params: {
    limit: number;
    cursor?: string | null;
    search?: string | null;
    type?: TransactionDirection | null;
  }): Promise<{ categories: Category[]; nextCursor: string | null }> {
    const { limit, cursor, search, type } = params;

    const where: Prisma.CategoryWhereInput = {};

    // Filtro por type
    if (type) {
      where.type = type;
    }

    // Filtro por nome
    if (search) {
      const normalized = search.toLowerCase();
      where.name = { contains: normalized };
    }

    const data = await this.prisma.category.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { name: "asc" },
    });

    let nextCursor: string | null = null;
    if (data.length > limit) {
      const nextItem = data.pop();
      nextCursor = nextItem!.id;
    }

    const categories = data.map(this.mapPrismaToDomain);

    return { categories, nextCursor };
  }
  async upsert(category: Category): Promise<Category> {
    const record = await this.prisma.category.upsert({
      where: { id: category.id },
      create: {
        id: category.id,
        name: category.name,
        type: category.type,
      },
      update: {
        name: category.name,
        type: category.type,
      },
    });

    return this.mapPrismaToDomain(record);
  }

  private mapPrismaToDomain(record: { id: string; name: string; type: TransactionDirection | null; createdAt: Date }): Category {
    return Category.rehydrate({
      id: record.id,
      name: record.name,
      type: record.type ?? TransactionDirection.INCOME,
      createdAt: record.createdAt,
    });
  }
}
