import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IMemberRepository } from "../domain/repositories/IMemberRepository";
import { IMemberCriticalSection } from "../domain/transactions/IMemberCriticalSection";

export type RestoreMemberInput = {
  memberId: string;
  restoredById: string;
  reason: string;
};

export type RestoreMemberOutput = {
  id: string;
};

export class RestoreMemberUseCase {
  constructor(
    private readonly _repo: IMemberRepository,
    private readonly criticalSection: IMemberCriticalSection,
  ) {}

  async execute(input: RestoreMemberInput): Promise<RestoreMemberOutput> {
    if (!input.reason || input.reason.trim().length < 3) {
      throw new ValidationError("RESTORE_REASON_REQUIRED");
    }

    return this.criticalSection.execute(input.memberId, async (ctx) => {
      const member = await ctx.memberRepository.findByIdIncludingDeleted(input.memberId);
      if (!member) throw new NotFoundError("MEMBER_NOT_FOUND");
      if (!member.isDeleted) throw new ConflictError("MEMBER_NOT_DELETED");

      const changes = {
        deletedAt: { before: member.deletedAt, after: null },
      };

      member.restore();
      await ctx.memberRepository.save(member);
      await ctx.restoreLogRepository.create({
        memberId: member.id,
        restoredById: input.restoredById,
        reason: input.reason.trim(),
        changes,
      });

      return { id: member.id };
    });
  }
}