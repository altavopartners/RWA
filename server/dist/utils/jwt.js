"use strict";
// src/utils/jwt.ts
// Centralized utility class for all JSON Web Token (JWT) operations.
//
// Uses `jsonwebtoken` library and retrieves the secret key via `getJWTSecret` from `crypto.ts`.
// Functions:
// - `sign(payload, expiresIn)`: Creates a signed JWT.
// - `verify(token)`: Verifies a JWT's signature and expiration, returning the decoded payload.
// - `decode(token)`: Decodes a JWT payload without verification.
// - `isExpired(token)`: Checks if a token is expired.
// - `getExpiration(token)`: Gets the expiration timestamp from a token.
// - `generateTokenPair(payload)`: Generates an access token (short expiry) and refresh token (long expiry).
// - `extractToken(authHeader)`: Extracts the Bearer token from an Authorization header.
// Ensures consistent JWT configuration (issuer, audience) and error handling across the application.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTokenExpired = exports.decodeToken = exports.verifyToken = exports.signToken = exports.JWTUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("./crypto"); // centralize secret handling here
class JWTUtils {
    /** Sign a token. Payload must contain userId, walletAddress, userType, sessionId. */
    static sign(payload, expiresIn = "24h") {
        try {
            const secret = (0, crypto_1.getJWTSecret)();
            const options = {
                expiresIn: expiresIn,
                issuer: "hex-port-api",
                audience: "hex-port-users",
            };
            return jsonwebtoken_1.default.sign(payload, secret, options);
        }
        catch (error) {
            console.error("JWT signing error:", error);
            throw new Error(`Failed to sign JWT: ${error.message}`);
        }
    }
    /** Verify token and return typed JWTPayload */
    static verify(token) {
        try {
            const secret = (0, crypto_1.getJWTSecret)();
            const decoded = jsonwebtoken_1.default.verify(token, secret, {
                issuer: "hex-port-api",
                audience: "hex-port-users",
            });
            return decoded;
        }
        catch (error) {
            if (error.name === "TokenExpiredError")
                throw new Error("JWT token has expired");
            if (error.name === "JsonWebTokenError")
                throw new Error("Invalid JWT token");
            if (error.name === "NotBeforeError")
                throw new Error("JWT token not yet valid");
            throw new Error(`JWT verification failed: ${error.message}`);
        }
    }
    /** Decode without verifying */
    static decode(token) {
        return jsonwebtoken_1.default.decode(token);
    }
    /** Check if a token is expired */
    static isExpired(token) {
        try {
            this.verify(token);
            return false;
        }
        catch (e) {
            return e.message === "JWT token has expired";
        }
    }
    /** Get expiration time in ms (or null if no exp) */
    static getExpiration(token) {
        const decoded = this.decode(token);
        return decoded?.exp ? decoded.exp * 1000 : null;
    }
    /** Generate access + refresh tokens */
    static generateTokenPair(payload) {
        const accessToken = this.sign(payload, process.env.JWT_EXPIRES_IN || "24h");
        const refreshToken = this.sign(payload, process.env.JWT_REFRESH_EXPIRES_IN || "7d");
        return { accessToken, refreshToken };
    }
    /** Extract Bearer token from Authorization header */
    static extractToken(authHeader) {
        if (!authHeader?.startsWith("Bearer "))
            return null;
        return authHeader.substring(7);
    }
}
exports.JWTUtils = JWTUtils;
/* Backwards-compatible exports */
exports.signToken = JWTUtils.sign;
exports.verifyToken = JWTUtils.verify;
exports.decodeToken = JWTUtils.decode;
exports.isTokenExpired = JWTUtils.isExpired;
//# sourceMappingURL=jwt.js.map