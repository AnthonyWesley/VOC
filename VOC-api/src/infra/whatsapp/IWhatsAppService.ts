import { WhatsAppConnectionStateResult, WhatsAppSendResult } from "../../shared/types/whatsapp";

export interface IWhatsAppService {
  sendMessage(to: string, message: string, instanceName: string): Promise<WhatsAppSendResult>;
  connectionState(instanceName: string): Promise<WhatsAppConnectionStateResult>;
}
