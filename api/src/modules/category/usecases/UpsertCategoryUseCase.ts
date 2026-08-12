import { TransactionDirection } from "@prisma/client";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { Category } from "../domain/entities/Category";
import { ICategoryRepository } from "../domain/repositories/ICategoryRepository";

export type UpsertCategoryInput = {
  id?: string; // se vazio cria nova
  name: string;
  type: TransactionDirection;
};

export class UpsertCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(input: UpsertCategoryInput): Promise<Category> {
    const { id, name, type } = input;

    if (!name || name.trim() === "") {
      throw new ValidationError("CATEGORY_NAME_REQUIRED");
    }

    let category: Category;

    if (id) {
      // Atualização: buscar categoria existente
      const existing = await this.categoryRepository.findById(id);
      if (!existing) {
        throw new ValidationError("CATEGORY_NOT_FOUND");
      }

      // Rehydrate mantendo createdAt original
      category = Category.rehydrate({
        id: existing.id,
        name: name.trim(),
        type,
        createdAt: existing.createdAt,
      });
    } else {
      // Criação
      category = Category.create({
        name: name.trim(),
        type,
      });
    }

    return this.categoryRepository.upsert(category);
  }
}
