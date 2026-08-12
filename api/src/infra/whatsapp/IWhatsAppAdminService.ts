import type {
  WhatsAppAdminResult,
  WhatsAppConnectionState,
  WhatsAppQrCode,
  WhatsAppInstanceInfo,
  CreateWhatsAppInstanceInput,
} from "./WhatsAppAdminResult";

export interface IWhatsAppAdminService {
  connectionState(instanceName: string): Promise<WhatsAppAdminResult<WhatsAppConnectionState>>;

  createInstance(input: CreateWhatsAppInstanceInput): Promise<WhatsAppAdminResult<WhatsAppInstanceInfo>>;

  getQrCode(instanceName: string): Promise<WhatsAppAdminResult<WhatsAppQrCode>>;

  deleteInstance(instanceName: string): Promise<WhatsAppAdminResult<void>>;

  restartInstance(instanceName: string): Promise<WhatsAppAdminResult<WhatsAppConnectionState>>;
}
