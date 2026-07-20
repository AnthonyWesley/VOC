import { MemberStatus } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IMemberRepository } from "../domain/repositories/IMemberRepository";
import { normalizePhone } from "../../../shared/utils/normalizePhone";

/* ---------------- UPDATE MEMBER ---------------- */

export type UpdateMemberInput = {
  memberId: string;
  fullName?: string;
  nickname?: string;
  birthDate?: Date;
  phone?: string;
  postcode?: string;
  address?: string;
  baptismDate?: Date;
  churchJoinDate?: Date;
  status?: MemberStatus;
};

export type UpdateMemberOutput = {
  id: string;
};

export class UpdateMemberUseCase {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(input: UpdateMemberInput): Promise<UpdateMemberOutput> {
    const { memberId, ...data } = input;

    if (!memberId) {
      throw new ValidationError("MISSING_MEMBER_ID", undefined, "ID do membro não informado");
    }

    if (data.phone !== undefined) {
      data.phone = normalizePhone(data.phone) ?? undefined;
    }

    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new NotFoundError("MEMBER_NOT_FOUND");
    }

    // Aplica as mudanças no agregado
    member.update(data);

    // Persiste no repositório
    await this.memberRepository.save(member);

    return { id: member.id };
  }
}
