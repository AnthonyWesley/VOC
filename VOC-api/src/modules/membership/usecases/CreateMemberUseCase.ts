import { Member } from "../domain/entities/Member";
import { IMemberRepository } from "../domain/repositories/IMemberRepository";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { IWhatsAppService } from "../../../infra/whatsapp/IWhatsAppService";
import { CreateNotificationUseCase } from "../../notification/usecases/CreateNotificationUseCase";
import { normalizePhone } from "../../../shared/utils/normalizePhone";

export type CreateMemberInput = {
  fullName: string;
  nickname?: string;
  birthDate: Date;
  phone?: string;
  postcode?: string;
  address?: string;
  baptismDate?: Date;
  churchJoinDate?: Date;
  userId?: string;
};

export type CreateMemberOutput = {
  id: string;
};

export class CreateMemberUseCase {
  constructor(
    private readonly memberRepository: IMemberRepository,
    private readonly whatsApp?: IWhatsAppService,
    private readonly createNotification?: CreateNotificationUseCase,
  ) {}

  async execute(input: CreateMemberInput): Promise<CreateMemberOutput> {
    const {
      fullName,
      nickname,
      birthDate,
      phone,
      postcode,
      address,
      baptismDate,
      churchJoinDate,
      userId,
    } = input;

    if (!fullName) throw new ValidationError("MISSING_FULL_NAME", undefined, "O nome completo é obrigatório");
    if (!birthDate) throw new ValidationError("MISSING_BIRTH_DATE", undefined, "A data de nascimento é obrigatória");

    // Phone is required for members 16+
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age >= 16 && !phone) {
      throw new ValidationError("PHONE_REQUIRED_FOR_16+", undefined, "O telefone é obrigatório para maiores de 16 anos");
    }

    const normalizedPhone = normalizePhone(phone) ?? undefined;

    // Prevent duplicate registration
    const normalizedFullName = fullName.trim().toLowerCase();
    const existing = await this.memberRepository.findByUniqueness(
      normalizedFullName,
      birthDate,
    );

    if (existing) {
      return { id: existing.id };
    }

    const member = Member.create({
      fullName,
      nickname,
      birthDate,
      phone: normalizedPhone,
      postcode,
      address,
      baptismDate,
      churchJoinDate: churchJoinDate ?? new Date(),
      userId,
    });

    await this.memberRepository.save(member);

    if (member.phone) {
      await this.whatsApp?.sendMessage(
        member.phone,
        `Oi ${member.fullName}! 🎉 Que alegria ter você fazendo parte da nossa família! Estamos muito felizes com sua chegada. Fique de olho nas novidades e venha viver momentos especiais com a gente.`,
        "default",
      ).catch(() => {});
    }

    if (userId && this.createNotification) {
      await this.createNotification.execute({
        userId,
        type: "MEMBRO_VINCULADO",
        title: "Bem-vindo à igreja!",
        message: `Seu cadastro como membro foi concluído. Seja bem-vindo(a), ${member.fullName}!`,
        payload: { memberId: member.id, memberName: member.fullName },
        deduplicationKey: `v1:membro-vinculado:${member.id}`,
      });
    }

    return { id: member.id };
  }
}
