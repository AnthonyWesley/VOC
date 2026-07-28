import { Prisma } from "@prisma/client";
import { Member } from "../domain/entities/Member";
import { IMemberRepository } from "../domain/repositories/IMemberRepository";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { IWhatsAppService } from "../../../infra/whatsapp/IWhatsAppService";
import { CreateNotificationUseCase } from "../../notification/usecases/CreateNotificationUseCase";
import { normalizePhone } from "../../../shared/utils/normalizePhone";
import { createLogger } from "../../../shared/logger/logger";

const logger = createLogger("create-member-usecase");

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
  created: boolean;
};

export class CreateMemberUseCase {
  constructor(
    private readonly memberRepository: IMemberRepository,
    private readonly whatsApp?: IWhatsAppService,
    private readonly createNotification?: CreateNotificationUseCase,
  ) {}

  async execute(input: CreateMemberInput, options?: { isPublicRegistration?: boolean }): Promise<CreateMemberOutput> {
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

    const normalizedFullName = fullName.trim().toLowerCase();

    const existing = await this.memberRepository.findByUniquenessIncludingDeleted(normalizedFullName, birthDate);

    if (existing?.deletedAt) {
      const code = options?.isPublicRegistration ? "MEMBER_REGISTRATION_CONFLICT" : "MEMBER_REACTIVATION_REQUIRED";
      throw new ConflictError(code, undefined, options?.isPublicRegistration
        ? "Não foi possível concluir o cadastro. Verifique os dados e tente novamente."
        : "Este registro foi removido e precisa de restauração explícita.");
    }

    if (existing) {
      return { id: existing.id, created: false };
    }

    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age >= 16 && !phone) {
      throw new ValidationError("PHONE_REQUIRED_FOR_16+", undefined, "O telefone é obrigatório para maiores de 16 anos");
    }

    const normalizedPhone = normalizePhone(phone) ?? undefined;

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

    try {
      await this.memberRepository.save(member);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const retry = await this.memberRepository.findByUniquenessIncludingDeleted(normalizedFullName, birthDate);

        if (retry?.deletedAt) {
          const code = options?.isPublicRegistration ? "MEMBER_REGISTRATION_CONFLICT" : "MEMBER_REACTIVATION_REQUIRED";
          throw new ConflictError(code, undefined, options?.isPublicRegistration
            ? "Não foi possível concluir o cadastro. Verifique os dados e tente novamente."
            : "Este registro foi removido e precisa de restauração explícita.");
        }

        if (retry) {
          return { id: retry.id, created: false };
        }

        logger.error({ errorCode: "UNEXPECTED_P2002", normalizedFullName, birthDate }, "P2002 after retry returned nothing");
        throw error;
      }

      throw error;
    }

    this.notifyPostCreation(member, userId);

    return { id: member.id, created: true };
  }

  private async notifyPostCreation(member: Member, userId?: string): Promise<void> {
    if (member.phone) {
      try {
        await this.whatsApp?.sendMessage(
          member.phone,
          `Oi ${member.fullName}! Que alegria ter você fazendo parte da nossa familia! Estamos muito felizes com sua chegada. Fique de olho nas novidades e venha viver momentos especiais com a gente.`,
          "default",
        );
      } catch (err) {
        logger.warn({ errorCode: "WHATSAPP_SEND_FAILED", memberId: member.id, err }, "WhatsApp send failed after member creation");
      }
    }

    if (userId && this.createNotification) {
      try {
        await this.createNotification.execute({
          userId,
          type: "MEMBRO_VINCULADO",
          title: "Bem-vindo à igreja!",
          message: `Seu cadastro como membro foi concluído. Seja bem-vindo(a), ${member.fullName}!`,
          payload: { memberId: member.id, memberName: member.fullName },
          deduplicationKey: `v1:membro-vinculado:${member.id}`,
        });
      } catch (err) {
        logger.warn({ errorCode: "NOTIFICATION_FAILED", memberId: member.id, err }, "Notification failed after member creation");
      }
    }
  }
}
