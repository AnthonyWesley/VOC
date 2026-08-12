import { Prisma } from "@prisma/client";

export function isReversalUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.includes("reversalOfId");
  }

  return typeof target === "string" && target.includes("reversalOfId");
}
