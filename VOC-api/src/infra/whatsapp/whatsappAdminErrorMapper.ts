import { AppError } from "../../shared/errors/AppError";
import { NotFoundError } from "../../shared/errors/NotFoundError";
import { ConflictError } from "../../shared/errors/ConflictError";
import { ValidationError } from "../../shared/errors/ValidationError";
import type { WhatsAppAdminFailureCode } from "./WhatsAppAdminResult";

export function whatsappAdminFailureToHttpError(code: WhatsAppAdminFailureCode): AppError {
  switch (code) {
    case "NOT_CONFIGURED":
      return new AppError("WHATSAPP_NOT_CONFIGURED", 503);

    case "INSTANCE_NOT_FOUND":
      return new NotFoundError("WHATSAPP_INSTANCE_NOT_FOUND");

    case "INSTANCE_ALREADY_EXISTS":
      return new ConflictError("WHATSAPP_INSTANCE_ALREADY_EXISTS");

    case "INVALID_REQUEST":
      return new ValidationError("WHATSAPP_INVALID_REQUEST");

    case "AUTH_ERROR":
      return new AppError("WHATSAPP_PROVIDER_AUTH_ERROR", 502);

    case "RATE_LIMITED":
      return new AppError("WHATSAPP_PROVIDER_RATE_LIMITED", 503);

    case "TIMEOUT":
      return new AppError("WHATSAPP_PROVIDER_TIMEOUT", 504);

    case "NETWORK_ERROR":
      return new AppError("WHATSAPP_PROVIDER_NETWORK_ERROR", 502);

    case "PROVIDER_ERROR":
      return new AppError("WHATSAPP_PROVIDER_ERROR", 502);

    case "INSTANCE_UNAVAILABLE":
      return new ConflictError("WHATSAPP_INSTANCE_UNAVAILABLE");

    case "INVALID_PROVIDER_RESPONSE":
      return new AppError("WHATSAPP_INVALID_PROVIDER_RESPONSE", 502);
  }
}
