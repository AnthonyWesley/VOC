// identity/domain/repositories/IUserRepository.ts

import { MemberStatus } from "@prisma/client";
import { DetailedMemberDTO } from "../../usecases/GetMemberDetailedUseCase";
import {
  ListMembersInput,
  PaginatedMembersOutput,
} from "../../usecases/ListMembersUseCase";
import { Member } from "../entities/Member";

export type BaseListFilters = {
  limit: number;
  cursor?: string;
  search?: string;
  status?: MemberStatus;
};

export interface IMemberRepository {
  findDetailedMember(id: string): Promise<DetailedMemberDTO | null>;
  findById(id: string): Promise<Member | null>;
  findByUniqueness(normalizedFullName: string, birthDate: Date): Promise<Member | null>;
  findByUniquenessIncludingDeleted(normalizedFullName: string, birthDate: Date): Promise<Member | null>;
  findByIdIncludingDeleted(id: string): Promise<Member | null>;
  save(user: Member): Promise<void>;
  delete(id: string): Promise<void>;

  findAllMembers(params: BaseListFilters): Promise<AvailableMembers>;

  findMembersAvailableForEvent(
    eventId: string,
    params: BaseListFilters,
  ): Promise<AvailableMembers>;

  findMembersAvailableForMinistry(
    ministryId: string,
    params: BaseListFilters,
  ): Promise<AvailableMembers>;

  findMembersAvailableForAssignment(
    eventId: string,
    ministryId: string,
    params: BaseListFilters,
  ): Promise<AvailableMembers>;
}

export type AvailableMembers = {
  members: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    birthDate: Date;
    phone: string | null;
    baptismDate: Date | null;
    churchJoinDate: Date;
    status: MemberStatus;
    hasHouseParticipation: boolean;
  }[];
  nextCursor: string | null;
};
