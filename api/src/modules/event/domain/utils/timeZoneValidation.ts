import { ConfigurationError } from "../../../../shared/errors/ConfigurationError";

export function assertValidTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
  } catch {
    throw new ConfigurationError("INVALID_SITE_TIMEZONE");
  }
}
