import { WhatsAppSendResult, maskPhone } from "../../shared/types/whatsapp";
import { createLogger } from "../../shared/logger/logger";
import { WhatsAppInstanceRepository } from "./WhatsAppInstanceRepository";
import { IWhatsAppService } from "./IWhatsAppService";
import type { IWhatsAppAdminService } from "./IWhatsAppAdminService";
import type {
  WhatsAppAdminResult,
  WhatsAppAdminFailureCode,
  WhatsAppAdminOperation,
  WhatsAppConnectionState,
  WhatsAppQrCode,
  WhatsAppInstanceInfo,
  CreateWhatsAppInstanceInput,
} from "./WhatsAppAdminResult";
import {
  evolutionQrCodeResponseSchema,
  evolutionConnectionStateResponseSchema,
  evolutionCreateInstanceResponseSchema,
  evolutionDeleteResponseSchema,
} from "./whatsappAdminSchemas";

const TIMEOUT_MS = 10_000;
const logger = createLogger("whatsapp-service");

function mapProviderConnectionState(rawState: string): WhatsAppConnectionState {
  switch (rawState.trim().toLowerCase()) {
    case "open":
    case "connected":
      return "CONNECTED";
    case "close":
    case "closed":
    case "disconnected":
      return "DISCONNECTED";
    case "connecting":
      return "CONNECTING";
    default:
      return "UNKNOWN";
  }
}

async function evolutionFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export class WhatsAppInstanceService implements IWhatsAppService, IWhatsAppAdminService {
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

    return this._requestWithClassification({
      url,
      method: "POST",
      body,
      phone,
      timeoutMs: TIMEOUT_MS,
    });
  }

  async connectionState(instanceName: string): Promise<WhatsAppAdminResult<WhatsAppConnectionState>> {
    const instance = await this.instanceRepo.findActiveByName(instanceName);
    if (!instance) {
      return { ok: false, code: "NOT_CONFIGURED", retryable: false };
    }

    const path = `/instance/connectionState/${instance.instanceName}`;
    const url = `${this.baseUrl}${path}`;

    try {
      const start = Date.now();

      const res = await evolutionFetch(url, {
        method: "GET",
        headers: { apikey: this.globalApiKey, "Content-Type": "application/json" },
      });

      const durationMs = Date.now() - start;

      if (!res.ok) {
        return this._classifyHttpError(res.status, "CONNECTION_STATE", durationMs);
      }

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        logger.warn({ operation: "whatsapp_connection_state", durationMs }, "Connection state returned non-JSON response");
        return { ok: false, code: "INVALID_PROVIDER_RESPONSE", retryable: false, providerStatus: res.status };
      }

      const parsed = evolutionConnectionStateResponseSchema.safeParse(data);
      if (!parsed.success) {
        logger.warn({ operation: "whatsapp_connection_state", durationMs }, "Connection state returned unexpected shape");
        return { ok: false, code: "INVALID_PROVIDER_RESPONSE", retryable: false };
      }

      const state = mapProviderConnectionState(parsed.data.instance.state);
      logger.info({ operation: "whatsapp_connection_state", state, durationMs }, "Connection state retrieved");
      return { ok: true, value: state };
    } catch (error: unknown) {
      return this._classifyFetchError(error, "CONNECTION_STATE");
    }
  }

  async createInstance(input: CreateWhatsAppInstanceInput): Promise<WhatsAppAdminResult<WhatsAppInstanceInfo>> {
    const path = "/instance/create";
    const url = `${this.baseUrl}${path}`;

    try {
      const start = Date.now();

      const res = await evolutionFetch(url, {
        method: "POST",
        headers: { apikey: this.globalApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceName: input.instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
          rejectCalls: false,
          groupsIgnore: false,
          alwaysOnline: true,
          readMessages: false,
          syncFullHistory: false,
        }),
      });

      const durationMs = Date.now() - start;

      if (!res.ok) {
        if (res.status === 409) {
          return { ok: false, code: "INSTANCE_ALREADY_EXISTS", retryable: false, providerStatus: 409 };
        }
        if (res.status === 404) {
          logger.warn({ operation: "whatsapp_create_instance", httpStatus: 404, durationMs }, "Create instance endpoint not found");
          return { ok: false, code: "INVALID_PROVIDER_RESPONSE", retryable: false, providerStatus: 404 };
        }
        return this._classifyHttpError(res.status, "CREATE_INSTANCE", durationMs);
      }

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        logger.warn({ operation: "whatsapp_create_instance", durationMs }, "Create instance returned non-JSON response");
        return { ok: false, code: "INVALID_PROVIDER_RESPONSE", retryable: false, providerStatus: res.status };
      }

      const parsed = evolutionCreateInstanceResponseSchema.safeParse(data);
      if (!parsed.success) {
        logger.warn({ operation: "whatsapp_create_instance", durationMs }, "Create instance returned unexpected shape");
        return { ok: false, code: "INVALID_PROVIDER_RESPONSE", retryable: false };
      }

      const info: WhatsAppInstanceInfo = {
        instanceName: input.instanceName,
        state: "CONNECTING",
        qrcode: parsed.data.base64 ?? null,
        pairingCode: parsed.data.qrcode?.pairingCode ?? null,
      };

      logger.info({ operation: "whatsapp_create_instance", instanceName: input.instanceName, durationMs }, "Instance created on provider");
      return { ok: true, value: info };
    } catch (error: unknown) {
      return this._classifyFetchError(error, "CREATE_INSTANCE");
    }
  }

  async getQrCode(instanceName: string): Promise<WhatsAppAdminResult<WhatsAppQrCode>> {
    const path = `/instance/connect/${instanceName}`;
    const url = `${this.baseUrl}${path}`;

    try {
      const start = Date.now();

      const res = await evolutionFetch(url, {
        method: "GET",
        headers: { apikey: this.globalApiKey, "Content-Type": "application/json" },
      });

      const durationMs = Date.now() - start;

      if (!res.ok) {
        return this._classifyHttpError(res.status, "GET_QR_CODE", durationMs);
      }

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        logger.warn({ operation: "whatsapp_get_qrcode", durationMs }, "Get QR code returned non-JSON response");
        return { ok: false, code: "INVALID_PROVIDER_RESPONSE", retryable: false, providerStatus: res.status };
      }

      const parsed = evolutionQrCodeResponseSchema.safeParse(data);
      if (!parsed.success) {
        logger.warn({ operation: "whatsapp_get_qrcode", durationMs }, "Get QR code returned unexpected shape");
        return { ok: false, code: "INVALID_PROVIDER_RESPONSE", retryable: false };
      }

      const qrCode: WhatsAppQrCode = {
        qrcode: parsed.data.base64 ?? parsed.data.qrcode ?? null,
        pairingCode: parsed.data.pairingCode ?? null,
      };

      logger.info({ operation: "whatsapp_get_qrcode", durationMs }, "QR code retrieved");
      return { ok: true, value: qrCode };
    } catch (error: unknown) {
      return this._classifyFetchError(error, "GET_QR_CODE");
    }
  }

  async deleteInstance(instanceName: string): Promise<WhatsAppAdminResult<void>> {
    const path = `/instance/delete/${instanceName}`;
    const url = `${this.baseUrl}${path}`;

    try {
      const start = Date.now();

      const res = await evolutionFetch(url, {
        method: "DELETE",
        headers: { apikey: this.globalApiKey },
      });

      const durationMs = Date.now() - start;

      if (res.status === 404) {
        logger.info({ operation: "whatsapp_delete_instance", instanceName, durationMs }, "Instance already deleted on provider");
        return { ok: true, value: undefined };
      }

      if (!res.ok) {
        return this._classifyHttpError(res.status, "DELETE_INSTANCE", durationMs);
      }

      logger.info({ operation: "whatsapp_delete_instance", instanceName, durationMs }, "Instance deleted on provider");
      return { ok: true, value: undefined };
    } catch (error: unknown) {
      return this._classifyFetchError(error, "DELETE_INSTANCE");
    }
  }

  async restartInstance(instanceName: string): Promise<WhatsAppAdminResult<WhatsAppConnectionState>> {
    const path = `/instance/restart/${instanceName}`;
    const url = `${this.baseUrl}${path}`;

    try {
      const start = Date.now();

      const res = await evolutionFetch(url, {
        method: "PUT",
        headers: { apikey: this.globalApiKey, "Content-Type": "application/json" },
      });

      const durationMs = Date.now() - start;

      if (!res.ok) {
        return this._classifyHttpError(res.status, "RESTART_INSTANCE", durationMs);
      }

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        logger.warn({ operation: "whatsapp_restart_instance", durationMs }, "Restart instance returned non-JSON response");
        return { ok: false, code: "INVALID_PROVIDER_RESPONSE", retryable: false, providerStatus: res.status };
      }

      const parsed = evolutionConnectionStateResponseSchema.safeParse(data);
      if (!parsed.success) {
        logger.warn({ operation: "whatsapp_restart_instance", durationMs }, "Restart instance returned unexpected shape");
        return { ok: false, code: "INVALID_PROVIDER_RESPONSE", retryable: false };
      }

      const state = mapProviderConnectionState(parsed.data.instance.state);
      logger.info({ operation: "whatsapp_restart_instance", state, durationMs }, "Instance restarted");
      return { ok: true, value: state };
    } catch (error: unknown) {
      return this._classifyFetchError(error, "RESTART_INSTANCE");
    }
  }

  private _normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  private _classifyHttpError(
    status: number,
    operation: WhatsAppAdminOperation,
    durationMs: number,
  ): WhatsAppAdminResult<never> {
    if (status === 401 || status === 403) {
      logger.warn({ operation: `whatsapp_${operation.toLowerCase()}`, resultCode: "AUTH_ERROR", httpStatus: status, durationMs }, "Provider auth error");
      return { ok: false, code: "AUTH_ERROR", retryable: false, providerStatus: status };
    }

    if (status === 429) {
      logger.warn({ operation: `whatsapp_${operation.toLowerCase()}`, resultCode: "RATE_LIMITED", httpStatus: status, durationMs }, "Provider rate limited");
      return { ok: false, code: "RATE_LIMITED", retryable: true, providerStatus: status };
    }

    if (status === 404) {
      const code: WhatsAppAdminFailureCode =
        operation === "CREATE_INSTANCE" ? "INVALID_PROVIDER_RESPONSE" : "INSTANCE_NOT_FOUND";
      logger.warn({ operation: `whatsapp_${operation.toLowerCase()}`, resultCode: code, httpStatus: status, durationMs }, "Provider returned 404");
      return { ok: false, code, retryable: false, providerStatus: status };
    }

    if (status === 409) {
      logger.warn({ operation: `whatsapp_${operation.toLowerCase()}`, resultCode: "INSTANCE_ALREADY_EXISTS", httpStatus: status, durationMs }, "Provider returned 409");
      return { ok: false, code: "INSTANCE_ALREADY_EXISTS", retryable: false, providerStatus: status };
    }

    if (status >= 400 && status <= 499) {
      logger.warn({ operation: `whatsapp_${operation.toLowerCase()}`, resultCode: "INVALID_REQUEST", httpStatus: status, durationMs }, "Provider returned 4xx");
      return { ok: false, code: "INVALID_REQUEST", retryable: false, providerStatus: status };
    }

    logger.warn({ operation: `whatsapp_${operation.toLowerCase()}`, resultCode: "PROVIDER_ERROR", httpStatus: status, durationMs }, "Provider returned 5xx");
    return { ok: false, code: "PROVIDER_ERROR", retryable: true, providerStatus: status };
  }

  private _classifyFetchError(
    error: unknown,
    operation: WhatsAppAdminOperation,
  ): WhatsAppAdminResult<never> {
    const err = error as Record<string, unknown>;
    const isAbort = err?.name === "AbortError";
    const code: "TIMEOUT" | "NETWORK_ERROR" = isAbort ? "TIMEOUT" : "NETWORK_ERROR";
    logger.warn({ operation: `whatsapp_${operation.toLowerCase()}`, resultCode: code }, "Provider request failed");
    return { ok: false, code, retryable: true };
  }

  private async _requestWithClassification(opts: {
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
        let data: Record<string, unknown> | null = null;
        try {
          data = (await res.json()) as Record<string, unknown>;
        } catch {
          /* 2xx with no JSON body — still ACCEPTED */
        }
        const providerMessageId = data?.key as string | undefined;
        logger.info({ operation: "whatsapp_send", status: "ACCEPTED", durationMs, phone: maskedPhone, hasProviderId: !!providerMessageId }, "WhatsApp message accepted by provider");
        return { ok: true, status: "ACCEPTED", providerMessageId };
      }

      const code = res.status === 401 || res.status === 403 ? "AUTH_ERROR"
        : res.status === 429 ? "RATE_LIMITED"
        : res.status >= 400 && res.status <= 499 ? "INVALID_REQUEST"
        : "PROVIDER_ERROR";

      const retryable = code !== "AUTH_ERROR" && code !== "INVALID_REQUEST";

      let errorBody = "";
      try {
        const text = await res.text();
        errorBody = text.length > 500 ? text.slice(0, 500) + "..." : text;
      } catch {
        /* ignore read errors */
      }

      logger.warn({ operation: "whatsapp_send", resultCode: code, retryable, httpStatus: res.status, durationMs, phone: maskedPhone }, "WhatsApp message was not accepted");
      return { ok: false, code, retryable, httpStatus: res.status };
    } catch (error: unknown) {
      const durationMs = Date.now() - start;
      const err = error as Record<string, unknown>;
      const code = err?.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR";
      logger.warn({ operation: "whatsapp_send", resultCode: code, retryable: true, durationMs, phone: maskPhone(opts.phone) }, "WhatsApp request failed");
      return { ok: false, code, retryable: true };
    }
  }
}
