import { AppError } from "./AppError";

export class UnauthorizedError extends AppError {
  constructor(
    code: string,
    details?: Record<string, unknown>,
    message = "Unauthorized.",
  ) {
    super(message, 401, code, details);
  }
}
