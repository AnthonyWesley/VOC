import { randomBytes } from "crypto";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { NotFoundError } from "../../../../shared/errors/NotFoundError";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IHashProvider } from "../../domain/services/IHashProvider";
import { IWhatsAppService } from "../../../../infra/whatsapp/IWhatsAppService";

export type AdminResetPasswordInput = {
  userId: string;
};

export type AdminResetPasswordOutput = {
  temporaryPassword: string;
  phone: string | null;
  whatsappSent: boolean;
};

export class AdminResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashProvider: IHashProvider,
    private readonly whatsApp?: IWhatsAppService,
  ) {}

  async execute(input: AdminResetPasswordInput): Promise<AdminResetPasswordOutput> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new NotFoundError("USER_NOT_FOUND");
    }

    if (!user.isActive) {
      throw new ValidationError("USER_INACTIVE");
    }

    const TEMP_PASSWORD_TTL_MS = 24 * 60 * 60 * 1000;

    const temporaryPassword = randomBytes(12).toString("base64url");
    const passwordHash = await this.hashProvider.hash(temporaryPassword);

    user.markPasswordAsTemporary(passwordHash, new Date(Date.now() + TEMP_PASSWORD_TTL_MS));

    await this.userRepository.save(user);

    const phone = user.member?.phone ?? null;

    let whatsappSent = false;
    if (phone && this.whatsApp) {
      const memberName = user.member?.fullName ?? user.email ?? "Usuário";
      try {
        await this.whatsApp.sendMessage(
          phone,
          `Oi ${memberName}! Sua senha foi redefinida pelo presidente. Sua nova senha temporária é: ${temporaryPassword}. Acesse o sistema e troque por uma senha pessoal.`,
          "default",
        );
        whatsappSent = true;
      } catch (err) {
        console.error("[AdminResetPassword] Falha ao enviar WhatsApp:", err);
      }
    }

    return {
      temporaryPassword,
      phone,
      whatsappSent,
    };
  }
}
