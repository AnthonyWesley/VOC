import { AppError } from "./AppError";

export class ConflictError extends AppError {
  constructor(
    code: string,
    details?: Record<string, unknown>,
    message = "Conflict occurred.",
  ) {
    super(message, 409, code, details);
  }
}
