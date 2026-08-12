import churchApi from "../../api/axios";
import {
  CreateUserInput,
  UserOutput,
  ListUsersInput,
  PaginatedUsersOutput,
} from "../types/userTypes";

export const userService = {
  create: async (data: CreateUserInput) => {
    try {
      const response = await churchApi.post("/users/", data);

      return response.data;
    } catch (error) {
      console.error("Erro no register:", error);
      throw error;
    }
  },

  find: async (userId?: string): Promise<UserOutput> => {
    const response = await churchApi.get(`/users/${userId}`);
    return response.data;
  },

  list: async (params: ListUsersInput): Promise<PaginatedUsersOutput> => {
    const { limit = 20, cursor, search, isActive } = params;

    const queryParams: Record<string, any> = { limit };
    if (cursor) queryParams.cursor = cursor;
    if (search) queryParams.search = search;
    if (isActive !== undefined) queryParams.isActive = isActive;

    const response = await churchApi.get("/users/", { params: queryParams });

    return {
      data: response.data.data ?? [],
      nextCursor: response.data.nextCursor ?? null,
    };
  },

  update: async (userId: string, data: any) => {
    const response = await churchApi.patch(`/users/${userId}`, data);
    return response.data;
  },

  updatePhone: async (id: string, phone: string) => {
    const response = await churchApi.patch(`/users/change-phone`, {
      id,
      phone,
    });
    return response.data;
  },

  delete: async (userId: string) => {
    const response = await churchApi.delete(`/users/${userId}`);
    return response.data.events;
  },

  active: async (userId: string) => {
    const response = await churchApi.patch(`/users/${userId}/activate`);
    return response.data;
  },

  deactivate: async (userId: string) => {
    const response = await churchApi.patch(`/users/${userId}/deactivate`);
    return response.data;
  },

  assignRole: async (userId: string, roleId: string) => {
    const response = await churchApi.patch(`/users/${userId}/assign`, {
      roleId,
    });
    return response.data;
  },

  removeRole: async (userId: string, roleId: string) => {
    const response = await churchApi.patch(`/users/${userId}/remove`, {
      roleId,
    });
    return response.data;
  },

  adminResetPassword: async (userId: string) => {
    const response = await churchApi.patch(`/users/${userId}/admin-reset-password`);
    return response.data;
  },
};
