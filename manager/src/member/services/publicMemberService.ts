import churchApi from "../../api/axios";

export type PublicMemberRegistrationInput = {
  fullName: string;
  nickname?: string;
  birthDate: string;
  phone?: string;
  address?: string;
  postcode?: string;
  baptismDate?: string;
  churchJoinDate?: string;
};

export const publicMemberService = {
  register: async (data: PublicMemberRegistrationInput) => {
    const response = await churchApi.post("/members/public/register", data);
    return response.data;
  },
};
