import { WhatsAppConnectionStateResult, WhatsAppSendResult } from "../../shared/types/whatsapp";
import { IWhatsAppService } from "./IWhatsAppService";

export class NullWhatsAppService implements IWhatsAppService {
  async sendMessage(): Promise<WhatsAppSendResult> {
    return { ok: false, code: "NOT_CONFIGURED", retryable: false };
  }

  async connectionState(): Promise<WhatsAppConnectionStateResult> {
    return { ok: false, code: "NOT_CONFIGURED" };
  }
}
