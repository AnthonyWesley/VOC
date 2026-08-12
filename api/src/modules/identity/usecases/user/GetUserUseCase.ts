import { UnauthorizedError } from "../../../../shared/errors/UnauthorizedError";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export type FindDetailedUseInputDto = { id: string };
export type FindDetailedUseOutputDto = {
  userId: string;
  email: string | null;
  isActive: boolean;
  photoUrl?: string | null;

  fullName: string | null;
  birthDate: Date | null;
  phone: string | null;
  baptismDate: Date | null;
  memberId: string | null;

  roles: Array<{ name: string; level: number }>;
  ministries: Array<{ id: string; name: string; joinedAt: Date }>;

  createdAt: Date;
};
export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    input: FindDetailedUseInputDto,
  ): Promise<FindDetailedUseOutputDto> {
    const user = await this.userRepository.findDetailedUser(input.id);

    if (!user) {
      throw new UnauthorizedError("UNAUTHORIZED_USER");
    }

    return {
      userId: user.userId,
      email: user.email,
      isActive: user.isActive,
      photoUrl: user.photoUrl,
      fullName: user?.fullName ?? null,
      birthDate: user?.birthDate ?? null,
      phone: user?.phone ?? null,
      baptismDate: user?.baptismDate ?? null,
      memberId: user?.memberId ?? null,
      createdAt: user.createdAt,
      roles: user.roles,
      ministries: user.ministries,
    };
  }
}
