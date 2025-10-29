"use strict";
// src/utils/prisma.ts
// Prisma Client singleton initializer.
//
// Ensures only one instance of the Prisma Client is created, especially important during
// development with hot-reloading to prevent multiple client connections.
// Configures query logging based on the `NODE_ENV`.
// Exports helper functions `testDatabaseConnection` and `disconnectDatabase` for managing
// the database connection lifecycle, used in `server.ts`.
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.testDatabaseConnection = exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = global.__prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
    });
if (process.env.NODE_ENV !== "production")
    global.__prisma = exports.prisma;
/**
 * Optional helpers exported for convenience
 */
const testDatabaseConnection = async () => {
    try {
        await exports.prisma.$connect();
        return true;
    }
    catch {
        return false;
    }
};
exports.testDatabaseConnection = testDatabaseConnection;
const disconnectDatabase = async () => {
    await exports.prisma.$disconnect();
};
exports.disconnectDatabase = disconnectDatabase;
//# sourceMappingURL=prisma.js.map