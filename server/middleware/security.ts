// src/middlewares/security.ts
// Contains various Express middleware functions for enhancing application security and monitoring.
// Includes CORS configuration, security HTTP headers (HSTS, CSP, etc.), request logging, and rate limiting.
// Also includes a global error handling middleware to catch unhandled exceptions and format error responses.

import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

/** auth endpoints rate limit */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/** general rate limiter */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** CORS options */
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
};

/** security headers */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
  );
  next();
};

/** dev request logger */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${req.ip}`);
  }
  next();
};

/** error handler */
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error occurred:", error);
  let statusCode = 500;
  let message = "Internal server error";
  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
  } else if (error.name === "UnauthorizedError" || error.message === "Unauthorized") {
    statusCode = 401;
    message = "Unauthorized access";
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};