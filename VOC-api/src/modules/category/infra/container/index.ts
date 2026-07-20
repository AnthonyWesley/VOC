// src/modules/finance/infra/factories/categoryController.ts
import { prisma } from "../../../../package/prisma";
import { PrismaCategoryRepository } from "../../domain/repositories/PrismaCategoryRepository";
import { GetAllCategoriesUseCase } from "../../usecases/GetAllCategoriesUseCase";
import { GetCategoryByIdUseCase } from "../../usecases/GetCategoryByIdUseCase";
import { UpsertCategoryUseCase } from "../../usecases/UpsertCategoryUseCase";
import { CategoryController } from "../controllers/CategoryController";

// Instancia o repository
const categoryRepository = new PrismaCategoryRepository(prisma);

// Instancia os UseCases
const upsert = new UpsertCategoryUseCase(categoryRepository);
const get = new GetCategoryByIdUseCase(categoryRepository);
const list = new GetAllCategoriesUseCase(categoryRepository);

// Instancia o Controller
export const categoryController = new CategoryController(upsert, get, list);
