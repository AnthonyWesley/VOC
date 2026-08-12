export type WhatsAppAdminFailureCode =
  | "NOT_CONFIGURED"
  | "INSTANCE_NOT_FOUND"
  | "INSTANCE_ALREADY_EXISTS"
  | "INVALID_REQUEST"
  | "AUTH_ERROR"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "PROVIDER_ERROR"
  | "INSTANCE_UNAVAILABLE"
  | "INVALID_PROVIDER_RESPONSE";

export type WhatsAppAdminOperation =
  | "CREATE_INSTANCE"
  | "GET_QR_CODE"
  | "CONNECTION_STATE"
  | "DELETE_INSTANCE"
  | "RESTART_INSTANCE";

export type WhatsAppAdminResult<T> =
  | { ok: true; value: T; providerStatus?: number }
  | { ok: false; code: WhatsAppAdminFailureCode; retryable: boolean; providerStatus?: number };

export type WhatsAppConnectionState =
  | "CONNECTED"
  | "DISCONNECTED"
  | "CONNECTING"
  | "UNKNOWN";

export type WhatsAppQrCode = {
  qrcode: string | null;
  pairingCode: string | null;
};

export type WhatsAppInstanceInfo = {
  instanceName: string;
  state: WhatsAppConnectionState;
  qrcode?: string | null;
  pairingCode?: string | null;
};

export type CreateWhatsAppInstanceInput = {
  instanceName: string;
};
