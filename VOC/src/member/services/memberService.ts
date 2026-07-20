import churchApi from "../../api/axios";
import {
  CreateMemberInput,
  DetailedMemberDTO,
  ListModeType,
  PaginatedMembersResponse,
  UpdateMemberInput,
} from "../types/memberTypes";

export const memberService = {
  create: async (data: CreateMemberInput) => {
    try {
      const response = await churchApi.post("/members/", data);
      return response.data;
    } catch (error) {
      console.error("Erro no register:", error);
      throw error;
    }
  },

  find: async (memberId?: string): Promise<DetailedMemberDTO> => {
    const response = await churchApi.get(`/members/${memberId}`);
    return response.data;
  },

  list: async ({
    limit = 20,
    cursor,
    mode = "all",
    eventId,
    ministryId,
    status,
    search,
  }: {
    limit?: number;
    cursor?: string;
    mode?: ListModeType;
    eventId?: string;
    ministryId?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedMembersResponse> => {
    const response = await churchApi.get(`/members`, {
      params: {
        limit,
        cursor,
        mode,
        eventId,
        ministryId,
        status,
        search,
      },
    });

    return response.data;
  },

  update: async (memberId: string, data: UpdateMemberInput) => {
    const response = await churchApi.patch(`/members/${memberId}`, data);
    return response.data;
  },
};
