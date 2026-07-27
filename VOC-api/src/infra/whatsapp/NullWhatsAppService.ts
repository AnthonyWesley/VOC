import { WhatsAppConnectionStateResult, WhatsAppSendResult } from "../../shared/types/whatsapp";
import { IWhatsAppService } from "./IWhatsAppService";

export class NullWhatsAppService implements IWhatsAppService {
  async sendMessage(_phone: string, _message: string, _messageType: string): Promise<WhatsAppSendResult> {
    return { ok: false, code: "NOT_CONFIGURED", retryable: false };
  }

  async connectionState(_instanceName: string): Promise<WhatsAppConnectionStateResult> {
    return { ok: false, code: "NOT_CONFIGURED" };
  }
}
