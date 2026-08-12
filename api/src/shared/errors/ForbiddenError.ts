import { AppError } from "./AppError";

export class ForbiddenError extends AppError {
  constructor(
    code: string,
    details?: Record<string, unknown>,
    message = "Access forbidden.",
  ) {
    super(message, 403, code, details);
  }
}
