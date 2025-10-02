// src/utils/prisma.ts
// Prisma Client singleton initializer.
//
// Ensures only one instance of the Prisma Client is created, especially important during
// development with hot-reloading to prevent multiple client connections.
// Configures query logging based on the `NODE_ENV`.
// Exports helper functions `testDatabaseConnection` and `disconnectDatabase` for managing
// the database connection lifecycle, used in `server.ts`.

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

/**
 * Optional helpers exported for convenience
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    return true;
  } catch {
    return false;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};