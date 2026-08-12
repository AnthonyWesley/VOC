// src/modules/finance/usecases/category/GetCategoryByIdUseCase.ts

import { Category } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ICategoryRepository } from "../domain/repositories/ICategoryRepository";

export class GetCategoryByIdUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(id: string): Promise<Category> {
    if (!id) throw new Error("CATEGORY_ID_REQUIRED");

    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundError("CATEGORY_NOT_FOUND");

    return {
      id: category.id,
      name: category.name,
      type: category.type,
      createdAt: category.createdAt,
    };
  }
}
