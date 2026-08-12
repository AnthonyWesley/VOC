export type CreateMemberInput = {
  fullName: string;
  nickname?: string;
  birthDate: Date;
  phone?: string;
  postcode?: string;
  address?: string;
  baptismDate?: Date;
  churchJoinDate?: Date;
  userId?: string;
};

export type UpdateMemberInput = {
  memberId: string;
  fullName?: string;
  nickname?: string;
  birthDate?: Date;
  phone?: string;
  postcode?: string;
  address?: string;
  baptismDate?: Date;
  churchJoinDate?: Date;
  status?: "ACTIVE" | "INACTIVE" | "VISITOR" | "TRANSFERRED";
};

export type DetailedMemberDTO = {
  id: string;
  fullName: string;
  nickname: string | null;
  birthDate: Date;
  phone: string | null;
  photoUrl: string | null;
  postcode: string | null;
  address: string | null;
  baptismDate: Date | null;
  churchJoinDate: Date;
  status: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  hasHouseParticipation?: boolean;
  ministries: Array<{
    id: string;
    name: string;
    description: string | null;
    joinedAt: Date;
  }>;
};

export type PaginatedMembersResponse = {
  data: DetailedMemberDTO[];
  nextCursor: string | null;
};
export type ListModeType = "all" | "event" | "ministry" | "assignment";
