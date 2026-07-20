import { IMemberRepository } from "../domain/repositories/IMemberRepository";

export type DetailedMemberInput = {
  memberId: string;
};

export type DetailedMemberDTO = {
  id: string;
  fullName: string;
  nickname: string | null;
  birthDate: Date;
  phone: string | null;
  postcode: string | null;
  address: string | null;
  baptismDate: Date | null;
  churchJoinDate: Date;
  status: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  hasHouseParticipation: boolean;

  ministries: Array<{
    id: string;
    name: string;
    description: string | null;
    joinedAt: Date;
  }>;
};

export class GetMemberDetailedUseCase {
  constructor(private readonly repo: IMemberRepository) {}

  async execute(input: DetailedMemberInput): Promise<DetailedMemberDTO | null> {
    const member = await this.repo.findDetailedMember(input.memberId);
    if (!member) return null;

    return {
      id: member.id,
      fullName: member.fullName,
      nickname: member.nickname,
      birthDate: member.birthDate,
      phone: member.phone,
      postcode: member.postcode,
      address: member.address,
      baptismDate: member.baptismDate,
      churchJoinDate: member.churchJoinDate,
      status: member.status,
      userId: member.userId,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      deletedAt: member.deletedAt,
      hasHouseParticipation: member.hasHouseParticipation,

      ministries: member.ministries.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description ?? null,
        joinedAt: m.joinedAt,
      })),
    };
  }
}
