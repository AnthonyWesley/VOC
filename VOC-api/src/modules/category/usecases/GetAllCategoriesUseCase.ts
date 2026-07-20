import { TransactionDirection } from "@prisma/client";
import { ICategoryRepository } from "../domain/repositories/ICategoryRepository";

export type ListCategoriesInput = {
  limit: number;
  cursor?: string;
  search?: string;
  type?: TransactionDirection;
};

export type PaginatedCategoriesOutput = {
  data: {
    id: string;
    name: string;
    type: TransactionDirection;
    createdAt: Date;
  }[];
  nextCursor: string | null;
};

export class GetAllCategoriesUseCase {
  constructor(private readonly repo: ICategoryRepository) {}

  async execute(
    input: ListCategoriesInput,
  ): Promise<PaginatedCategoriesOutput> {
    const { categories, nextCursor } = await this.repo.findAll(input);

    return {
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        createdAt: c.createdAt,
      })),
      nextCursor,
    };
  }
}
