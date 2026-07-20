// identity/domain/repositories/IUserRepository.ts

import { FindDetailedUseOutputDto } from "../../usecases/user/GetUserUseCase";
import { ListUsersOutput } from "../../usecases/user/ListUsersUseCase";
import { User } from "../entities/User";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findDetailedUser(id: string): Promise<FindDetailedUseOutputDto | null>;
  findAll(params: {
    limit: number;
    cursor?: string | null;
    search?: string | null;
    isActive?: boolean | null;
  }): Promise<{
    users: ListUsersOutput[];
    nextCursor: string | null;
  }>;
  findAuthUser(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  assignRole(userId: string, roleId: string): Promise<void>;
  removeRole(userId: string, roleId: string): Promise<void>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
