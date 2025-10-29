/**
 * Middleware to verify JWT access tokens and attach user info to req.user.
 *
 * Checks Authorization header for a Bearer token.
 * If valid → attaches user info to request.
 * If invalid/missing → responds with 401 Unauthorized.
 */

import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../types/auth";
import { debug } from "../utils/debug";

export const verifyJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
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
    const payload = verifyToken(token);

    // Attach user info to request object
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      walletAddress: payload.walletAddress,
      userType: payload.userType,
      sessionId: payload.sessionId,
    };

    return next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid token";

    // Log at debug level since expired tokens are expected before login
    debug.info(`[Auth] JWT verification failed: ${message}`, {
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
