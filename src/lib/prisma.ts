/**
 * Prisma Client Singleton
 *
 * This ensures only one instance of PrismaClient is created,
 * preventing connection pool exhaustion and improving performance.
 * In development, the instance is cached on the global object to
 * survive Next.js hot-reloading.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
