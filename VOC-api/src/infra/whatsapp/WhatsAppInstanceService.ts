import { IWhatsAppService } from "./IWhatsAppService";

export class WhatsAppInstanceService implements IWhatsAppService {
  private readonly baseUrl: string;
  private readonly globalApiKey: string;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_URL ?? "";
    this.globalApiKey = process.env.EVOLUTION_API_KEY ?? "";
  }

  async sendMessage(
    to: string,
    message: string,
    instanceName: string,
  ): Promise<void> {
    const instance = await this._findInstance(instanceName);
    if (!instance) {
      throw new Error(`Nenhuma instância WhatsApp ativa encontrada para "${instanceName}"`);
    }

    const phone = this._normalizePhone(to);

    const result = await this.request<{ status?: string }>(
      `/message/sendText/${instance.instanceName}`,
      "POST",
      {
        number: phone,
        options: { delay: 0, presence: "composing" },
        text: message,
      },
      instance.apiKey,
    );

    if (!result) {
      throw new Error(`WhatsApp API retornou erro ao enviar para ${phone}`);
    }
  }

  // ========= Instance Management =========

  async createInstance(
    instanceName: string,
  ): Promise<{ qrcode: string; base64: string } | null> {
    const res = await fetch(`${this.baseUrl}/instance/create`, {
      method: "POST",
      headers: {
        apikey: this.globalApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
        rejectCalls: false,
        groupsIgnore: false,
        alwaysOnline: true,
        readMessages: false,
        syncFullHistory: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    return {
      qrcode: data?.qrcode?.pairingCode ?? null,
      base64: data?.base64 ?? null,
    };
  }

  async getQrCode(
    instanceName: string,
  ): Promise<{ qrcode: string; base64: string } | null> {
    const data = await this.request<any>(
      `/instance/connect/${instanceName}`,
      "GET",
      undefined,
      this.globalApiKey,
    );
    if (!data) return null;

    return {
      qrcode: data?.qrcode?.pairingCode ?? null,
      base64: data?.base64 ?? null,
    };
  }

  async connectionState(instanceName: string): Promise<string> {
    const data = await this.request<any>(
      `/instance/connectionState/${instanceName}`,
      "GET",
      undefined,
      this.globalApiKey,
    );

    return data.instance.state ?? "close";
  }

  async deleteInstance(instanceName: string): Promise<void> {
    await fetch(`${this.baseUrl}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: { apikey: this.globalApiKey },
    });
  }

  async setWebhook(instanceName: string, webhookUrl: string): Promise<void> {
    await this.request(
      `/instance/setWebhook/${instanceName}`,
      "POST",
      {
        webhook: { url: webhookUrl, enabled: true },
      },
      this.globalApiKey,
    );
  }

  async restartInstance(instanceName: string): Promise<void> {
    await this.request(
      `/instance/restart/${instanceName}`,
      "PUT",
      undefined,
      this.globalApiKey,
    );
  }

  // ========= Private =========

  private _normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  private async _findInstance(instanceName: string) {
    const { prisma } = await import("../../package/prisma");
    const instance = await prisma.whatsAppInstance.findFirst({
      where: { instanceName, isActive: true },
    });
    if (instance) return instance;
    return prisma.whatsAppInstance.findFirst({
      where: { isActive: true },
    });
  }

  private async request<T>(
    path: string,
    method: string,
    body: unknown,
    apiKey: string,
  ): Promise<T | null> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) return null;
    return res.json() as Promise<T>;
  }
}
