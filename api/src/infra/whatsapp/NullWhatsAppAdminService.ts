import type { IWhatsAppAdminService } from "./IWhatsAppAdminService";
import type {
  WhatsAppAdminResult,
  WhatsAppConnectionState,
  WhatsAppQrCode,
  WhatsAppInstanceInfo,
  CreateWhatsAppInstanceInput,
} from "./WhatsAppAdminResult";

export class NullWhatsAppAdminService implements IWhatsAppAdminService {
  async connectionState(_instanceName: string): Promise<WhatsAppAdminResult<WhatsAppConnectionState>> {
    return { ok: false, code: "NOT_CONFIGURED", retryable: false };
  }

  async createInstance(_input: CreateWhatsAppInstanceInput): Promise<WhatsAppAdminResult<WhatsAppInstanceInfo>> {
    return { ok: false, code: "NOT_CONFIGURED", retryable: false };
  }

  async getQrCode(_instanceName: string): Promise<WhatsAppAdminResult<WhatsAppQrCode>> {
    return { ok: false, code: "NOT_CONFIGURED", retryable: false };
  }

  async deleteInstance(_instanceName: string): Promise<WhatsAppAdminResult<void>> {
    return { ok: false, code: "NOT_CONFIGURED", retryable: false };
  }

  async restartInstance(_instanceName: string): Promise<WhatsAppAdminResult<WhatsAppConnectionState>> {
    return { ok: false, code: "NOT_CONFIGURED", retryable: false };
  }
}
