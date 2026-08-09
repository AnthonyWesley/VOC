import { IMemberRepository } from "../domain/repositories/IMemberRepository";
import { IMemberCriticalSection } from "../domain/transactions/IMemberCriticalSection";
import { NotFoundError } from "../../../shared/errors/NotFoundError";

export type DeleteMemberInput = {
  memberId: string;
};

export class DeleteMemberUseCase {
  constructor(
    private readonly _repo: IMemberRepository,
    private readonly criticalSection: IMemberCriticalSection,
  ) {}

  async execute(input: DeleteMemberInput): Promise<void> {
    await this.criticalSection.execute(input.memberId, async (ctx) => {
      const member = await ctx.memberRepository.findByIdIncludingDeleted(input.memberId);

      if (!member) {
        throw new NotFoundError("MEMBER_NOT_FOUND");
      }

      if (member.isDeleted) {
        return;
      }

      member.delete();
      await ctx.memberRepository.save(member);
    });
  }
}