// identity/domain/repositories/IRoleRepository.ts
import { Role } from "../entities/Role";

export interface IRoleRepository {
  findById(id: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  findByName(name: string): Promise<Role | null>;
}
