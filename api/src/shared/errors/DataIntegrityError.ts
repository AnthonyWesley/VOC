import { AppError } from "./AppError";

export class DataIntegrityError extends AppError {
  constructor(
    code: string,
    details?: Record<string, unknown>,
    message = "Data integrity violation.",
  ) {
    super(message, 500, code, details);
  }
}
