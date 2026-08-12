// identity/domain/repositories/IUserRepository.ts

import { TransactionDirection } from "@prisma/client";
import { Category } from "../entities/Category";

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findAll(params: {
    limit: number;
    cursor?: string | null;
    search?: string | null;
    type?: TransactionDirection | null;
  }): Promise<{ categories: Category[]; nextCursor: string | null }>;
  upsert(category: Category): Promise<Category>;
}
