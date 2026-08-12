import { AppError } from "./AppError";

export class ConfigurationError extends AppError {
  constructor(code: string, details?: Record<string, unknown>) {
    super("Configuration error", 500, code, details);
  }
}
