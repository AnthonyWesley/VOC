import { WhatsAppConnectionState, WhatsAppConnectionStateResult, WhatsAppSendResult, maskPhone } from "../../shared/types/whatsapp";
import { createLogger } from "../../shared/logger/logger";
import { WhatsAppInstanceRepository } from "./WhatsAppInstanceRepository";
import { IWhatsAppService } from "./IWhatsAppService";

const TIMEOUT_MS = 10_000;
const logger = createLogger("whatsapp-service");

export class WhatsAppInstanceService implements IWhatsAppService {
  private readonly baseUrl: string;
  private readonly globalApiKey: string;

  constructor(private readonly instanceRepo: WhatsAppInstanceRepository) {
    this.baseUrl = process.env.EVOLUTION_URL ?? "";
    this.globalApiKey = process.env.EVOLUTION_API_KEY ?? "";
  }

  async sendMessage(to: string, message: string, instanceName: string): Promise<WhatsAppSendResult> {
    const instance = await this.instanceRepo.findActiveByName(instanceName);
    if (!instance) {
      logger.warn({ operation: "whatsapp_send", resultCode: "INSTANCE_UNAVAILABLE", phone: maskPhone(to) }, "No active WhatsApp instance found");
      return { ok: false, code: "INSTANCE_UNAVAILABLE", retryable: false };
    }

    const phone = this._normalizePhone(to);
    const path = `/message/sendText/${instance.instanceName}`;
    const url = `${this.baseUrl}${path}`;
    const body = JSON.stringify({
      number: phone,
      options: { delay: 0, presence: "composing" },
      text: message,
    });

    return this._requestWithClassification<{ key?: string; status?: string }>({
      url,
      method: "POST",
      body,
      phone,
      timeoutMs: TIMEOUT_MS,
    });
  }

  async connectionState(instanceName: string): Promise<WhatsAppConnectionStateResult> {
    const instance = await this.instanceRepo.findActiveByName(instanceName);
    if (!instance) {
      return { ok: false, code: "NOT_CONFIGURED" };
    }

    const path = `/instance/connectionState/${instance.instanceName}`;
    const url = `${this.baseUrl}${path}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const start = Date.now();

      let res: Response;
      try {
        res = await fetch(url, {
          method: "GET",
          headers: { apikey: this.globalApiKey, "Content-Type": "application/json" },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      const durationMs = Date.now() - start;

      if (!res.ok) {
        const code = res.status === 401 || res.status === 403 ? "AUTH_ERROR"
          : res.status >= 500 ? "PROVIDER_ERROR"
          : "PROVIDER_ERROR";
        logger.warn({ operation: "whatsapp_connection_state", resultCode: code, httpStatus: res.status, durationMs }, "Connection state check failed");
        return { ok: false, code };
      }

      let data: any;
      try {
        data = await res.json();
      } catch {
        logger.warn({ operation: "whatsapp_connection_state", durationMs }, "Connection state returned non-JSON response");
        return { ok: false, code: "PROVIDER_ERROR" };
      }

      const rawState: string = data?.instance?.state ?? "close";
      const mapped: WhatsAppConnectionState | null =
        rawState === "open" ? "CONNECTED"
        : rawState === "close" ? "DISCONNECTED"
        : rawState === "connecting" ? "CONNECTING"
        : null;

      if (!mapped) {
        logger.warn({ operation: "whatsapp_connection_state", rawState }, "Connection state returned unknown value");
        return { ok: true, state: "UNKNOWN" };
      }

      logger.info({ operation: "whatsapp_connection_state", state: mapped, durationMs }, "Connection state retrieved");
      return { ok: true, state: mapped };
    } catch (error: any) {
      const errCode: "TIMEOUT" | "NETWORK_ERROR" = error?.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR";
      logger.warn({ operation: "whatsapp_connection_state", resultCode: errCode }, "Connection state request failed");
      return { ok: false, code: errCode };
    }
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
    const data = await this._legacyRequest<any>(`/instance/connect/${instanceName}`, "GET");
    if (!data) return null;
    return { qrcode: data?.qrcode?.pairingCode ?? null, base64: data?.base64 ?? null };
  }

  async deleteInstance(instanceName: string): Promise<void> {
    await fetchWithTimeout(`${this.baseUrl}/instance/delete/${instanceName}`, {
      method: "DELETE", headers: { apikey: this.globalApiKey },
    });
  }

  async setWebhook(instanceName: string, webhookUrl: string): Promise<void> {
    await this._legacyRequest(`/instance/setWebhook/${instanceName}`, "POST", {
      webhook: { url: webhookUrl, enabled: true },
    });
  }

  async restartInstance(instanceName: string): Promise<void> {
    await this._legacyRequest(`/instance/restart/${instanceName}`, "PUT");
  }

  private _normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  private async _requestWithClassification<T extends Record<string, unknown>>(opts: {
    url: string;
    method: string;
    body?: string;
    phone: string;
    timeoutMs: number;
  }): Promise<WhatsAppSendResult> {
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), opts.timeoutMs);
      let res: Response;

      try {
        res = await fetch(opts.url, {
          method: opts.method,
          headers: { apikey: this.globalApiKey, "Content-Type": "application/json" },
          body: opts.body,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      const durationMs = Date.now() - start;
      const maskedPhone = maskPhone(opts.phone);

      if (res.ok) {
        let data: T | null = null;
        try {
          data = await res.json() as T;
        } catch {
          // 2xx with no JSON body or invalid JSON — still ACCEPTED
        }
        const providerMessageId = data?.key as string | undefined;
        logger.info({ operation: "whatsapp_send", status: "ACCEPTED", durationMs, phone: maskedPhone, hasProviderId: !!providerMessageId }, "WhatsApp message accepted by provider");
        return { ok: true, status: "ACCEPTED", providerMessageId };
      }

      // Non-2xx classification
      const code = res.status === 401 || res.status === 403 ? "AUTH_ERROR"
        : res.status === 429 ? "RATE_LIMITED"
        : res.status >= 400 && res.status <= 499 ? "INVALID_REQUEST"
        : res.status >= 500 ? "PROVIDER_ERROR"
        : "PROVIDER_ERROR";

      const retryable = code !== "AUTH_ERROR" && code !== "INVALID_REQUEST";

      // Read error body with size limit
      let errorBody = "";
      try {
        const text = await res.text();
        errorBody = text.length > 500 ? text.slice(0, 500) + "..." : text;
      } catch {
        // ignore read errors
      }

      logger.warn({ operation: "whatsapp_send", resultCode: code, retryable, httpStatus: res.status, durationMs, phone: maskedPhone }, "WhatsApp message was not accepted");
      return { ok: false, code, retryable, httpStatus: res.status };
    } catch (error: any) {
      const durationMs = Date.now() - start;
      const code = error?.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR";
      logger.warn({ operation: "whatsapp_send", resultCode: code, retryable: true, durationMs, phone: maskPhone(opts.phone) }, "WhatsApp request failed");
      return { ok: false, code, retryable: true };
    }
  }

  private async _legacyRequest<T>(path: string, method: string, body?: unknown): Promise<T | null> {
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
