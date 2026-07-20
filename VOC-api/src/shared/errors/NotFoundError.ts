import { AppError } from "./AppError";

export class NotFoundError extends AppError {
  constructor(
    code: string,
    details?: Record<string, unknown>,
    message = "Resource not found.",
  ) {
    super(message, 404, code, details);
  }
}
