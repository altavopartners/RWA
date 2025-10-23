"use strict";
/**
 * Middleware to verify JWT access tokens and attach user info to req.user.
 *
 * Checks Authorization header for a Bearer token.
 * If valid → attaches user info to request.
 * If invalid/missing → responds with 401 Unauthorized.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = void 0;
const jwt_1 = require("../utils/jwt");
const verifyJWT = (req, res, next) => {
    try {
        // Check Authorization header (case-insensitive)
        const authHeader = req.get("authorization") || req.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authorization required",
            });
        }
        const token = authHeader.split(" ")[1]?.trim();
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token required",
            });
        }
        // Verify token (throws if invalid/expired)
        const payload = (0, jwt_1.verifyToken)(token);
        // Attach user info to request object
        req.user = {
            id: payload.userId,
            walletAddress: payload.walletAddress,
            userType: payload.userType,
            sessionId: payload.sessionId,
        };
        return next();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Invalid token";
        // Log suspicious activity (optional but useful in production)
        console.warn(`[Auth] JWT verification failed: ${message}`, {
            ip: req.ip,
            url: req.originalUrl,
            userAgent: req.get("User-Agent"),
        });
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
exports.verifyJWT = verifyJWT;
//# sourceMappingURL=auth.js.map