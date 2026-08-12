// src/modules/finance/infra/controllers/CategoryController.ts
import { Request, Response } from "express";
import { GetAllCategoriesUseCase } from "../../usecases/GetAllCategoriesUseCase";
import { GetCategoryByIdUseCase } from "../../usecases/GetCategoryByIdUseCase";
import { UpsertCategoryUseCase } from "../../usecases/UpsertCategoryUseCase";
import { TransactionDirection } from "@prisma/client";

export class CategoryController {
  constructor(
    private readonly upsertCategoryUseCase: UpsertCategoryUseCase,
    private readonly getCategoryByIdUseCase: GetCategoryByIdUseCase,
    private readonly getAllCategoriesUseCase: GetAllCategoriesUseCase,
  ) {}

  // Criar ou atualizar categoria
  async upsert(request: Request, response: Response): Promise<Response> {
    const { id, name, type } = request.body;

    const category = await this.upsertCategoryUseCase.execute({
      id,
      name,
      type,
    });

    const statusCode = id ? 200 : 201;
    return response.status(statusCode).json(category);
  }

  // Buscar categoria por ID
  async getById(request: Request, response: Response): Promise<Response> {
    const categoryId = String(request.params.categoryId);

    const category = await this.getCategoryByIdUseCase.execute(categoryId);
    return response.status(200).json(category);
  }

  // Listar todas categorias
  // src/controllers/CategoryController.ts

  async list(request: Request, response: Response): Promise<Response> {
    const { limit, cursor, search, type } = request.query;

    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);

    const result = await this.getAllCategoriesUseCase.execute({
      limit: parsedLimit,
      cursor: cursor ? String(cursor) : undefined,
      search: search ? String(search) : undefined,

      type: type ? (String(type) as TransactionDirection) : undefined,
    });

    return response.status(200).json(result);
  }
}
