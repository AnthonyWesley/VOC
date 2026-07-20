import { IMemberRepository } from "../domain/repositories/IMemberRepository";
import { NotFoundError } from "../../../shared/errors/NotFoundError";

export type DeleteMemberInput = {
  memberId: string;
};

export class DeleteMemberUseCase {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(input: DeleteMemberInput): Promise<void> {
    const member = await this.memberRepository.findById(input.memberId);

    if (!member) {
      throw new NotFoundError("Member not found");
    }

    member.delete();
    await this.memberRepository.save(member);
  }
}