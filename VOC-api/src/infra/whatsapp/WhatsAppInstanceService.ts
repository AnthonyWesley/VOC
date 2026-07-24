import { IWhatsAppService } from "./IWhatsAppService";

const TIMEOUT_MS = 10_000;

export class WhatsAppInstanceService implements IWhatsAppService {
  private readonly baseUrl: string;
  private readonly globalApiKey: string;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_URL ?? "";
    this.globalApiKey = process.env.EVOLUTION_API_KEY ?? "";
  }

  async sendMessage(to: string, message: string, instanceName: string): Promise<void> {
    const instance = await this._findInstance(instanceName);
    if (!instance) throw new Error(`Nenhuma instância WhatsApp ativa encontrada para "${instanceName}"`);

    const phone = this._normalizePhone(to);
    const result = await this.request<{ status?: string }>(
      `/message/sendText/${instance.instanceName}`,
      "POST",
      { number: phone, options: { delay: 0, presence: "composing" }, text: message },
    );
    if (!result) throw new Error(`WhatsApp API retornou erro ao enviar para ${phone}`);
  }

  async createInstance(instanceName: string): Promise<{ qrcode: string; base64: string } | null> {
    const res = await fetchWithTimeout(`${this.baseUrl}/instance/create`, {
      method: "POST",
      headers: { apikey: this.globalApiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS",
        rejectCalls: false, groupsIgnore: false, alwaysOnline: true,
        readMessages: false, syncFullHistory: false,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { qrcode: data?.qrcode?.pairingCode ?? null, base64: data?.base64 ?? null };
  }

  async getQrCode(instanceName: string): Promise<{ qrcode: string; base64: string } | null> {
    const data = await this.request<any>(`/instance/connect/${instanceName}`, "GET");
    if (!data) return null;
    return { qrcode: data?.qrcode?.pairingCode ?? null, base64: data?.base64 ?? null };
  }

  async connectionState(instanceName: string): Promise<string> {
    const data = await this.request<any>(`/instance/connectionState/${instanceName}`, "GET");
    return data?.instance?.state ?? "close";
  }

  async deleteInstance(instanceName: string): Promise<void> {
    await fetchWithTimeout(`${this.baseUrl}/instance/delete/${instanceName}`, {
      method: "DELETE", headers: { apikey: this.globalApiKey },
    });
  }

  async setWebhook(instanceName: string, webhookUrl: string): Promise<void> {
    await this.request(`/instance/setWebhook/${instanceName}`, "POST", {
      webhook: { url: webhookUrl, enabled: true },
    });
  }

  async restartInstance(instanceName: string): Promise<void> {
    await this.request(`/instance/restart/${instanceName}`, "PUT");
  }

  private _normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  private async _findInstance(instanceName: string) {
    const { prisma } = await import("../../package/prisma");
    const instance = await prisma.whatsAppInstance.findFirst({ where: { instanceName, isActive: true } });
    if (instance) return instance;
    return prisma.whatsAppInstance.findFirst({ where: { isActive: true } });
  }

  private async request<T>(path: string, method: string, body?: unknown): Promise<T | null> {
    const res = await fetchWithTimeout(`${this.baseUrl}${path}`, {
      method,
      headers: { apikey: this.globalApiKey, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}
