import churchApi from "../../api/axios";

export type CreateMinistryInput = {
  name: string;
  description: string;
};
export type DetailedMinistryDTO = {
  id: string;
  name: string;
  description: string | null;
  leaderId: string | null;
  createdAt: string;
  updatedAt: string;

  members: Array<{
    id: string;
    fullName: string;
    birthDate: string;
    phone: string | null;
    joinedAt: string;
    status: string;
  }>;
};

export type ListMinistriesOutput = {
  id: string;
  name: string;
  description?: string | null;
  leaderId: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export const ministriesService = {
  create: async (data: CreateMinistryInput) => {
    try {
      const response = await churchApi.post("/ministries", data);

      return response.data;
    } catch (error) {
      console.error("Erro no register:", error);
      throw error;
    }
  },

  find: async (ministryId?: string): Promise<DetailedMinistryDTO> => {
    const response = await churchApi.get(`/ministries/${ministryId}`);
    return response.data;
  },

  list: async (): Promise<ListMinistriesOutput[]> => {
    const response = await churchApi.get(`/ministries/`);

    return response.data;
  },

  update: async (ministryId: string, data: any) => {
    const response = await churchApi.patch(`/ministries/${ministryId}`, data);
    return response.data;
  },

  assignMember(ministryId: string, memberId: string) {
    return churchApi.patch(`/ministries/${ministryId}/assignMember`, {
      memberId,
    });
  },

  removeMember: async (ministryId: string, memberId: string) => {
    return churchApi.patch(`/ministries/${ministryId}/removeMember`, {
      memberId,
    });
  },
};
