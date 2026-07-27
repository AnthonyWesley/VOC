export type WhatsAppFailureCode =
  | "NOT_CONFIGURED"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "AUTH_ERROR"
  | "INVALID_REQUEST"
  | "INSTANCE_UNAVAILABLE";

export type WhatsAppSendResult =
  | {
      ok: true;
      status: "ACCEPTED";
      providerMessageId?: string;
    }
  | {
      ok: false;
      code: WhatsAppFailureCode;
      retryable: boolean;
      httpStatus?: number;
    };

export type WhatsAppConnectionState =
  | "CONNECTED"
  | "DISCONNECTED"
  | "CONNECTING"
  | "UNKNOWN";

export type WhatsAppConnectionStateResult =
  | {
      ok: true;
      state: WhatsAppConnectionState;
    }
  | {
      ok: false;
      code: Extract<WhatsAppFailureCode, "NOT_CONFIGURED" | "TIMEOUT" | "NETWORK_ERROR" | "AUTH_ERROR" | "PROVIDER_ERROR">;
    };

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) {
    return "*".repeat(digits.length || 1);
  }
  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}
