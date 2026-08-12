import { WhatsAppSendResult } from "../../shared/types/whatsapp";

export interface IWhatsAppService {
  sendMessage(to: string, message: string, instanceName: string): Promise<WhatsAppSendResult>;
}
