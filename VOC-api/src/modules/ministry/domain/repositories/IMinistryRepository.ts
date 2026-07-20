// identity/domain/repositories/IUserRepository.ts

import { DetailedMinistryDTO } from "../../usecases/GetMinistryDetailedUseCase";
import { Ministry } from "../entities/Ministry";

export interface IMinistryRepository {
  findDetailedMinistry(id: string): Promise<DetailedMinistryDTO | null>;
  findById(id: string): Promise<Ministry | null>;
  findAll(): Promise<Ministry[]>;
  save(user: Ministry): Promise<void>;
  delete(id: string): Promise<void>;
  assignMember(ministryId: string, memberId: string): Promise<void>;
  removeMember(ministryId: string, memberId: string): Promise<void>;
}
