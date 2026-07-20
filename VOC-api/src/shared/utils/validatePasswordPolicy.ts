import { ValidationError } from "../errors/ValidationError";

export function validatePasswordPolicy(password: string): void {
  if (password.length < 8) {
    throw new ValidationError("PASSWORD_TOO_SHORT", { minLength: 8 });
  }
  if (!/[a-z]/.test(password)) {
    throw new ValidationError("PASSWORD_MISSING_LOWERCASE");
  }
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError("PASSWORD_MISSING_UPPERCASE");
  }
  if (!/\d/.test(password)) {
    throw new ValidationError("PASSWORD_MISSING_NUMBER");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new ValidationError("PASSWORD_MISSING_SPECIAL");
  }
}
