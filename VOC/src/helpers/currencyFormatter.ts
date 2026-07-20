export const currencyFormatter = {
  format: (value: string | number): string => {
    if (typeof value === "number") {
      return value.toLocaleString("en-GB", {
        style: "currency",
        currency: "GBP",
      });
    }

    if (typeof value === "string") {
      const numeric = value.replace(/\D/g, "");
      const number = parseFloat(numeric || "0") / 100;

      return number.toLocaleString("en-GB", {
        style: "currency",
        currency: "GBP",
      });
    }

    return "£0.00";
  },

  toNumber(value: string | number): number {
    if (typeof value === "number") return value;

    if (!value) return 0;

    const cleaned = value.replace(/[^\d.-]/g, "");

    return parseFloat(cleaned) || 0;
  },
};
