import { DetailedMinistryDTO } from "../../usecases/GetMinistryDetailedUseCase";
import { ListMinistriesOutput } from "../../usecases/ListMinistriesUseCase";
import { Ministry } from "../entities/Ministry";

export type MemberMinistryRecord = {
  memberId: string;
  ministryId: string;
  joinedAt: Date;
};

export interface IMinistryRepository {
  findDetailedMinistry(id: string): Promise<DetailedMinistryDTO | null>;
  findById(id: string): Promise<Ministry | null>;
  findAll(): Promise<Ministry[]>;
  findAllWithDetails(): Promise<ListMinistriesOutput[]>;
  save(user: Ministry): Promise<void>;
  delete(id: string): Promise<void>;
  assignMember(ministryId: string, memberId: string): Promise<void>;
  removeMember(ministryId: string, memberId: string): Promise<void>;
  findMemberMinistry(ministryId: string, memberId: string): Promise<MemberMinistryRecord | null>;
}
