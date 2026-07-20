import churchApi from "../../api/axios";

export interface RoleOutput {
  id: string;
  name: string;
  level: number;
  description: string;
}

export const roleService = {
  list: async (): Promise<RoleOutput[]> => {
    const response = await churchApi.get(`/roles/`);
    return response.data;
  },
};
