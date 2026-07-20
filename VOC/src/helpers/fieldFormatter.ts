type NameFormat =
  | "default"
  | "first"
  | "firstTwo"
  | "firstInitialLast"
  | "truncate";
export const fieldFormatter = {
  name(
    value: string,
    format: NameFormat = "default",
    truncateLimit: number = 25,
  ): string {
    if (!value) return "";

    const capitalized = value
      .toLocaleLowerCase("pt-BR")
      .replace(/(^|\s)\p{L}/gu, (char) => char.toLocaleUpperCase("pt-BR"));

    const parts = capitalized.trim().split(/\s+/);

    const formatters: Record<NameFormat, () => string> = {
      default: () => capitalized,
      first: () => parts[0] ?? "",
      firstTwo: () => parts.slice(0, 2).join(" "),
      firstInitialLast: () => {
        const first = parts[0] ?? "";
        const lastInitial = parts[1]?.charAt(0) ?? "";
        return lastInitial ? `${first} ${lastInitial}.` : first;
      },
      truncate: () => {
        if (value.length > truncateLimit) {
          return value.substring(0, truncateLimit) + "...";
        }
        return value;
      },
    };

    return formatters[format]();
  },

  phone(value: string): string {
    if (!value) return "";

    // remove tudo que não é número
    let cleaned = value.replace(/\D/g, "");

    // remove código internacional +55 apenas se houver mais de 11 dígitos
    if (cleaned.startsWith("55") && cleaned.length > 11) {
      cleaned = cleaned.slice(2);
    }

    // limita ao tamanho máximo de celular brasileiro
    cleaned = cleaned.slice(0, 11);

    if (cleaned.length < 3) return cleaned;

    if (cleaned.length < 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }

    if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }

    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  },

  cpf(value: string): string {
    let digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length > 9)
      digits = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    else if (digits.length > 6)
      digits = digits.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (digits.length > 3)
      digits = digits.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    return digits;
  },

  cnpj(value: string): string {
    let digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length > 12)
      digits = digits.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/,
        "$1.$2.$3/$4-$5",
      );
    else if (digits.length > 8)
      digits = digits.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, "$1.$2.$3/$4");
    else if (digits.length > 5)
      digits = digits.replace(/(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (digits.length > 2)
      digits = digits.replace(/(\d{2})(\d{1,3})/, "$1.$2");
    return digits;
  },

  postalCodeUK(value: string): string {
    if (!value) return "";

    // Remove tudo que não é letra ou número, max 7 chars (UK postcode limit)
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);

    if (cleaned.length <= 3) return cleaned;

    const outward = cleaned.slice(0, cleaned.length - 3);
    const inward = cleaned.slice(-3);

    return `${outward} ${inward}`;
  },

  normalizePostcodeUK(value: string): string {
    if (!value) return "";
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  },

  normalizeField(value: string): string {
    return value.replace(/\D/g, "").trim();
  },
};
