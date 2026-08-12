import { prisma } from "../prisma";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizePhone(
  phone?: string,
  defaultCountry: "BR" | "AR" | "UY" = "BR",
) {
  if (!phone) return null;

  const clean = phone.replace(/[^\d+]/g, "");

  try {
    const parsed = parsePhoneNumberFromString(
      clean,
      clean.startsWith("+") ? undefined : defaultCountry,
    );

    if (parsed && parsed.isValid()) {
      return parsed.number;
    }

    return null;
  } catch {
    return null;
  }
}

export const prismaExtended = prisma.$extends({
  query: {
    user: {
      async create({ args, query }) {
        if (args.data?.phone) {
          const after = normalizePhone(args.data.phone);
          args.data.phone = after ?? args.data.phone;
        }

        return query(args);
      },

      async update({ args, query }) {
        if (args.data?.phone) {
          const after = normalizePhone(args.data.phone);
          args.data.phone = after ?? args.data.phone;
        }

        return query(args);
      },
    },
  },
});
