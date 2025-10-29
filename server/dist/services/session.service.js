"use strict";
// src/services/session.service.ts
// Central service layer for managing user authentication sessions stored in the database.
//
// Interacts directly with the Prisma `AuthSession` model to perform CRUD and lifecycle operations.
// Provides functions to:
// - Create new sessions (e.g., after successful login).
// - Find sessions by access token or refresh token.
// - Refresh sessions (update tokens and expiry).
// - Validate session activity and check for expiration.
// - Invalidate a single session (logout).
// - Invalidate all sessions for a user (logout all devices).
// - Retrieve a list of a user's active sessions.
// - Clean up expired or inactive sessions periodically.
// - Generate secure refresh tokens and manage default expiry times.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const prisma_1 = require("../utils/prisma");
const crypto_1 = __importDefault(require("crypto"));
class SessionService {
    /**
     * Create a new authentication session
     */
    static async createSession(params) {
        try {
            const session = await prisma_1.prisma.authSession.create({
                data: {
                    userId: params.userId,
                    token: params.token,
                    refreshToken: params.refreshToken || this.generateRefreshToken(),
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                    expiresAt: params.expiresAt || this.getDefaultExpiry(),
                    isActive: true,
                },
            });
            return session;
        }
        catch (error) {
            console.error("Failed to create session:", error);
            throw new Error("Failed to create authentication session");
        }
    }
    /**
     * Find active session by access token
     */
    static async findByToken(token) {
        try {
            const session = await prisma_1.prisma.authSession.findFirst({
                where: {
                    token,
                    isActive: true
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            walletAddress: true,
                            userType: true,
                            isVerified: true,
                            publicKeyHex: true
                        }
                    }
                }
            });
            if (!session)
                return null;
            // Check expiration
            if (session.expiresAt && session.expiresAt < new Date()) {
                await this.invalidateSession(session.id);
                return null;
            }
            return session;
        }
        catch (error) {
            console.error("Failed to find session by token:", error);
            return null;
        }
    }
    /**
     * Find session by refresh token
     */
    static async findByRefreshToken(refreshToken) {
        try {
            return await prisma_1.prisma.authSession.findFirst({
                where: {
                    refreshToken,
                    isActive: true,
                    expiresAt: { gte: new Date() }
                },
            });
        }
        catch (error) {
            console.error("Failed to find session by refresh token:", error);
            return null;
        }
    }
    /**
     * Refresh session with new tokens
     */
    static async refreshSession(sessionId, newToken, newRefreshToken, expiresAt) {
        try {
            return await prisma_1.prisma.authSession.update({
                where: { id: sessionId },
                data: {
                    token: newToken,
                    refreshToken: newRefreshToken,
                    expiresAt: expiresAt || this.getDefaultExpiry(),
                },
            });
        }
        catch (error) {
            console.error("Failed to refresh session:", error);
            throw new Error("Failed to refresh authentication session");
        }
    }
    /**
     * Validate session activity and expiration
     */
    static async validateSession(sessionId) {
        try {
            const session = await prisma_1.prisma.authSession.findUnique({
                where: { id: sessionId },
            });
            if (!session || !session.isActive)
                return false;
            if (session.expiresAt && session.expiresAt < new Date()) {
                await this.invalidateSession(sessionId);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error("Failed to validate session:", error);
            return false;
        }
    }
    /**
     * Invalidate a session (logout)
     */
    static async invalidateSession(sessionId) {
        try {
            return await prisma_1.prisma.authSession.update({
                where: { id: sessionId },
                data: {
                    isActive: false,
                    expiresAt: new Date()
                },
            });
        }
        catch (error) {
            console.error("Failed to invalidate session:", error);
            throw new Error("Failed to logout");
        }
    }
    /**
     * Invalidate all sessions for a user
     */
    static async invalidateAllUserSessions(userId) {
        try {
            const result = await prisma_1.prisma.authSession.updateMany({
                where: {
                    userId,
                    isActive: true
                },
                data: {
                    isActive: false,
                    expiresAt: new Date()
                },
            });
            return result.count;
        }
        catch (error) {
            console.error("Failed to invalidate all user sessions:", error);
            throw new Error("Failed to logout all sessions");
        }
    }
    /**
     * Get user's active sessions
     */
    static async getUserActiveSessions(userId) {
        try {
            return await prisma_1.prisma.authSession.findMany({
                where: {
                    userId,
                    isActive: true,
                    expiresAt: { gte: new Date() }
                },
                orderBy: { createdAt: "desc" }
            });
        }
        catch (error) {
            console.error("Failed to get user sessions:", error);
            return [];
        }
    }
    /**
     * Cleanup expired sessions
     */
    static async cleanupExpiredSessions() {
        try {
            const result = await prisma_1.prisma.authSession.updateMany({
                where: {
                    OR: [
                        { expiresAt: { lt: new Date() } },
                        { isActive: false }
                    ]
                },
                data: { isActive: false },
            });
            return result.count;
        }
        catch (error) {
            console.error("Failed to cleanup expired sessions:", error);
            return 0;
        }
    }
    /**
     * Generate secure refresh token
     */
    static generateRefreshToken() {
        return crypto_1.default.randomBytes(32).toString("hex");
    }
    /**
     * Get default expiry (24 hours)
     */
    static getDefaultExpiry() {
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
}
exports.SessionService = SessionService;
//# sourceMappingURL=session.service.js.map