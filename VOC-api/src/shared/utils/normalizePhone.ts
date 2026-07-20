export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 0) return null;

  if (digits.startsWith("55") && digits.length === 13) return `+${digits}`;
  if (digits.startsWith("44") && digits.length === 12) return `+${digits}`;

  if (digits.length === 11) return `+55${digits}`;

  return `+${digits}`;
}
