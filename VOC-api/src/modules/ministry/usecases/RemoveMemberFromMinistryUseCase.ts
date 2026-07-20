import { PrismaClient } from "@prisma/client";
import { IMinistryRepository } from "../domain/repositories/IMinistryRepository";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";

export type RemoveMemberFromMinistryInput = {
  ministryId: string;
  memberId: string;
  userId: string;
  userLevel: number;
};

export type RemoveMemberFromMinistryOutput = {
  id: string;
};

export class RemoveMemberFromMinistryUseCase {
  constructor(
    private readonly memberRepository: IMinistryRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    input: RemoveMemberFromMinistryInput,
  ): Promise<RemoveMemberFromMinistryOutput> {
    const { ministryId, memberId, userId, userLevel } = input;

    if (!ministryId) {
      throw new ValidationError("MISSING_MINISTRY_ID");
    }

    if (!memberId) {
      throw new ValidationError("MISSING_MEMBER_ID");
    }

    const ministry = await this.prisma.ministry.findUnique({
      where: { id: ministryId },
      select: { leaderId: true },
    });

    if (!ministry) {
      throw new ValidationError("MINISTRY_NOT_FOUND");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { member: { select: { id: true } } },
    });

    const isLeader = user?.member?.id && user.member.id === ministry.leaderId;
    if (!isLeader && userLevel < 80) {
      throw new ForbiddenError("NOT_MINISTRY_LEADER", undefined, "Você não é líder deste ministério");
    }

    await this.memberRepository.removeMember(ministryId, memberId);

    return {
      id: memberId,
    };
  }
}
