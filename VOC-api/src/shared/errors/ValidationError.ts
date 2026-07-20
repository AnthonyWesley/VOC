import { AppError } from "./AppError";

export class ValidationError extends AppError {
  constructor(
    code: string,
    details?: Record<string, unknown>,
    message = "Validation failed.",
  ) {
    super(message, 422, code, details);
  }
}
