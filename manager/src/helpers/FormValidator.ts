import { toast } from "react-toastify";

export const FormValidator = {
  isValidName(name: string): boolean {
    const valid = /^[A-Za-zÀ-ú0-9\s]{3,}$/.test(name.trim());
    if (!valid)
      toast.error(
        "Nome inválido. Deve conter ao menos 3 caracteres e não usar símbolos.",
      );
    return valid;
  },

  isValidEmail(email: string): boolean {
    const valid = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);
    if (!valid) toast.error("E-mail inválido. Exemplo: nome@dominio.com");
    return valid;
  },

  isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, "");
    const valid = /^(\d{11})$/.test(cleaned);
    if (!valid)
      toast.error("Telefone inválido. Use o formato (DD)9 9999 9999.");
    return valid;
  },

  isValidPrice(price: string | number): boolean {
    let isZero = false;

    if (typeof price === "string") {
      const cleaned = price.replace(/[^\d,]/g, "").replace(",", ".");
      const num = parseFloat(cleaned);
      isZero = isNaN(num) || num === 0;
    } else {
      isZero = price === 0;
    }

    if (isZero) {
      toast.error("O valor da transação deve ser maior que zero.");
      return false;
    }

    return true;
  },

  validateAll({
    name,
    email,
    phone,
    price,
  }: {
    name?: string;
    email?: string;
    phone?: string;
    cnpj?: string;
    price?: string | number;
    goal?: string | number;
  }): boolean {
    let isValid = true;

    if (name !== undefined) isValid = this.isValidName(name) && isValid;
    if (email !== undefined) isValid = this.isValidEmail(email) && isValid;
    if (phone !== undefined) isValid = this.isValidPhone(phone) && isValid;
    if (price !== undefined) isValid = this.isValidPrice(price) && isValid;

    return isValid;
  },
};
