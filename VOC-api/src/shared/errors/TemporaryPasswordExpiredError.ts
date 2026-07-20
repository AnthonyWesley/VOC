import { AppError } from "./AppError";

export class TemporaryPasswordExpiredError extends AppError {
  constructor(
    code = "TEMPORARY_PASSWORD_EXPIRED",
    details?: Record<string, unknown>,
    message = "Temporary password has expired. Request a new one.",
  ) {
    super(message, 410, code, details);
  }
}
