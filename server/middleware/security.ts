// src/middlewares/security.ts
// Contains various Express middleware functions for enhancing application security and monitoring.
// Includes CORS configuration, security HTTP headers (HSTS, CSP, etc.), request logging, and rate limiting.
// Also includes a global error handling middleware to catch unhandled exceptions and format error responses.

import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

/**
 * STRICT RATE LIMITER FOR AUTHENTICATION ENDPOINTS
 * Prevents brute-force attacks by limiting failed login attempts.
 * - Window: 15 minutes
 * - Max attempts: 10 (only failed attempts count)
 */
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

/**
 * GENERAL RATE LIMITER FOR ALL ROUTES
 * Protects against API abuse and Denial-of-Service (DoS) attacks.
 * - Window: 15 minutes  
 * - Max requests: 100 per client
 * - Applies to: All routes globally
 */
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

/**
 * CORS (CROSS-ORIGIN RESOURCE SHARING) CONFIGURATION
 * Controls which external domains can access our API.
 * - Whitelists: Localhost (3000, 3001) and FRONTEND_URL from env
 * - Blocks: All other origins with CORS error
 * - Allows: Credentials (cookies, authentication)
 */
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
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

/**
 * SECURITY HTTP HEADERS MIDDLEWARE
 * Sets critical security headers to protect against common web vulnerabilities.
 * - Removes X-Powered-By: Hides Express.js stack information
 * - X-Content-Type-Options: Prevents MIME-type sniffing
 * - X-Frame-Options: Blocks clickjacking attacks
 * - X-XSS-Protection: Enables browser XSS filter
 * - Referrer-Policy: Controls referrer information leakage
 * - Content-Security-Policy: Restricts resource loading to trusted sources only
 */
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

/**
 * DEVELOPMENT REQUEST LOGGER
 * Logs all incoming requests to console for debugging and monitoring.
 * - Only active in development environment (NODE_ENV=development)
 * - Shows: Timestamp, HTTP method, URL, and client IP
 * - Purpose: API traffic visibility and troubleshooting
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${req.ip}`);
  }
  next();
};

/**
 * GLOBAL ERROR HANDLING MIDDLEWARE
 * Catches all unhandled errors and formats consistent JSON error responses.
 * - Prevents server crashes from uncaught exceptions
 * - Maps specific error types to appropriate HTTP status codes
 * - Security: Hides stack traces in production environment
 * - Handles: ValidationError, UnauthorizedError, JWT errors, etc.
 */
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