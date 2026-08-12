import { Prisma, PrismaClient } from "@prisma/client";

export type PrismaDatabaseClient = PrismaClient | Prisma.TransactionClient;
