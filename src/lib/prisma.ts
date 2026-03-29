// ==========================================================
// CLIENTE PRISMA - Conexão com o banco de dados
// ==========================================================
// Reutiliza a conexão em desenvolvimento para evitar criar
// múltiplas instâncias do Prisma Client.
// ==========================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
