// src/modules/finance/infra/services/categoriesService.ts
import churchApi from "../../api/axios";

export type TransactionDirectionType = "INCOME" | "EXPENSE";

export interface CategoryPayload {
  id?: string; // opcional, para update
  name: string;
  type: TransactionDirectionType;
}

export interface CategoryOutput {
  id: string;
  name: string;
  type: TransactionDirectionType;
  createdAt: string;
  updatedAt?: string;
}

export type PaginatedCategoriesResponse = {
  data: CategoryOutput[];
  nextCursor: string | null;
};

export const categoriesService = {
  // Criar ou atualizar categoria
  upsert: async (data: CategoryPayload): Promise<CategoryOutput> => {
    try {
      const response = await churchApi.post("/categories", data);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar/atualizar categoria:", error);
      throw error;
    }
  },

  // Buscar categoria por ID
  findById: async (categoryId: string): Promise<CategoryOutput> => {
    const response = await churchApi.get(`/categories/${categoryId}`);
    return response.data;
  },

  // Listar todas categorias
  list: async (params?: {
    limit?: number;
    cursor?: string;
    search?: string;
    type?: string;
  }): Promise<PaginatedCategoriesResponse> => {
    const query = new URLSearchParams();

    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.cursor) query.append("cursor", params.cursor);
    if (params?.search) query.append("search", params.search);
    if (params?.type) query.append("type", params.type);

    const response = await churchApi.get(`/categories?${query.toString()}`);

    return response.data;
  },
};
