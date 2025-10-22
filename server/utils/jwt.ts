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

import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { JWTPayload } from "../types/auth";
import { getJWTSecret } from "./crypto"; // centralize secret handling here

export class JWTUtils {
  /** Sign a token. Payload must contain userId, walletAddress, userType, sessionId. */
static sign(payload: Omit<JWTPayload, "iat" | "exp">, expiresIn: string | number = "24h"): string {
    try {
      const secret = getJWTSecret();
      const options: SignOptions = {
        expiresIn: expiresIn as SignOptions["expiresIn"],
        issuer: "hex-port-api",
        audience: "hex-port-users",
      };
      return jwt.sign(payload as JwtPayload, secret, options);
    } catch (error: any) {
      console.error("JWT signing error:", error);
      throw new Error(`Failed to sign JWT: ${error.message}`);
    }
  }

  /** Verify token and return typed JWTPayload */
  static verify(token: string): JWTPayload {
    try {
      const secret = getJWTSecret();
      const decoded = jwt.verify(token, secret, {
        issuer: "hex-port-api",
        audience: "hex-port-users",
      }) as JWTPayload;
      return decoded;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") throw new Error("JWT token has expired");
      if (error.name === "JsonWebTokenError") throw new Error("Invalid JWT token");
      if (error.name === "NotBeforeError") throw new Error("JWT token not yet valid");
      throw new Error(`JWT verification failed: ${error.message}`);
    }
  }

  /** Decode without verifying */
  static decode(token: string): JWTPayload | null {
    return jwt.decode(token) as JWTPayload | null;
  }

  /** Check if a token is expired */
  static isExpired(token: string): boolean {
    try {
      this.verify(token);
      return false;
    } catch (e: any) {
      return e.message === "JWT token has expired";
    }
  }

  /** Get expiration time in ms (or null if no exp) */
  static getExpiration(token: string): number | null {
    const decoded = this.decode(token);
    return decoded?.exp ? decoded.exp * 1000 : null;
  }

  /** Generate access + refresh tokens */
  static generateTokenPair(payload: Omit<JWTPayload, "iat" | "exp">) {
    const accessToken = this.sign(payload, process.env.JWT_EXPIRES_IN || "24h");
    const refreshToken = this.sign(payload, process.env.JWT_REFRESH_EXPIRES_IN || "7d");
    return { accessToken, refreshToken };
  }

  /** Extract Bearer token from Authorization header */
  static extractToken(authHeader: string | undefined): string | null {
    if (!authHeader?.startsWith("Bearer ")) return null;
    return authHeader.substring(7);
  }
}

/* Backwards-compatible exports */
export const signToken = JWTUtils.sign;
export const verifyToken = JWTUtils.verify;
export const decodeToken = JWTUtils.decode;
export const isTokenExpired = JWTUtils.isExpired;
