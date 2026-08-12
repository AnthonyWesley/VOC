import { UnauthorizedError } from "../../../../shared/errors/UnauthorizedError";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export type FindAuthUserInputDto = { id: string };
export type FindAuthUserOutputDto = {
  userId: string;
  memberId: string | null;
  email: string | null;
  photoUrl?: string | null;
  isActive: boolean;
  isTemporaryPassword: boolean;
  roles: Array<{ name: string; level: number }>;
  fullName: string | null;
  phone: string | null;
  birthDate: Date | null;
  baptismDate: Date | null;
  status: string | null;
  churchJoinDate: Date | null;
  ministries: Array<{ id: string; name: string; joinedAt: Date }>;
  ledMinistries: Array<{ id: string; name: string }>;
  createdAt: Date;
};

export class GetAuthenticatedUser {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: FindAuthUserInputDto): Promise<FindAuthUserOutputDto> {
    const user = await this.userRepository.findAuthUser(input.id);

    if (!user) {
      throw new UnauthorizedError("UNAUTHORIZED_USER");
    }

    const memberRaw = user.member as {
      id?: string;
      fullName?: string;
      birthDate?: Date;
      phone?: string | null;
      baptismDate?: Date | null;
      status?: string;
      churchJoinDate?: Date;
      ministries?: Array<{
        id: string;
        ministry: { id: string; name: string };
        joinedAt: Date;
      }>;
      ledMinistries?: Array<{
        id: string;
        name: string;
      }>;
    } | null;

    return {
      userId: user.id,
      email: user.email,
      isActive: user.isActive,
      photoUrl: user.photoUrl,
      isTemporaryPassword: user.isTemporaryPassword,
      fullName: memberRaw?.fullName ?? null,
      birthDate: memberRaw?.birthDate ?? null,
      phone: memberRaw?.phone ?? null,
      baptismDate: memberRaw?.baptismDate ?? null,
      memberId: memberRaw?.id ?? null,
      status: memberRaw?.status ?? null,
      churchJoinDate: memberRaw?.churchJoinDate ?? null,
      ministries:
        memberRaw?.ministries?.map((m) => ({
          id: m.ministry.id,
          name: m.ministry.name,
          joinedAt: m.joinedAt,
        })) ?? [],
      ledMinistries:
        memberRaw?.ledMinistries?.map((m) => ({
          id: m.id,
          name: m.name,
        })) ?? [],
      createdAt: user.createdAt,
      roles: user.roles,
    };
  }
}
