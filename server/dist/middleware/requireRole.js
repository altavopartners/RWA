"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = exports.errorHandler = exports.requestLogger = exports.apiRateLimit = exports.generalRateLimit = exports.authRateLimit = exports.securityHeaders = exports.corsOptions = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/** Enhanced CORS options with environment-based configuration */
exports.corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:4000",
            process.env.FRONTEND_URL,
            process.env.ADMIN_URL,
        ].filter(Boolean);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            // In production, log the blocked origin for monitoring
            if (process.env.NODE_ENV === "production") {
                console.warn(`CORS blocked request from origin: ${origin}`);
            }
            callback(new Error("Not allowed by CORS"), false);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
        "Accept",
        "Accept-Version",
        "Content-Length",
        "Content-MD5"
    ],
    exposedHeaders: ["X-Total-Count", "X-Page-Count", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
    maxAge: 600, // 10 minutes
};
/** Enhanced security headers with CSP tailored to your needs */
const securityHeaders = (req, res, next) => {
    res.removeHeader("X-Powered-By");
    // Security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    // Dynamic CSP based on environment
    const isDev = process.env.NODE_ENV === "development";
    const cspDirectives = {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "img-src": ["'self'", "data:", "https:", "blob:"],
        "font-src": ["'self'", "https:", "data:"],
        "connect-src": ["'self'", "https:", ...(isDev ? ["ws:", "wss:"] : [])],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'none'"],
        "block-all-mixed-content": [],
        "upgrade-insecure-requests": process.env.NODE_ENV === "production" ? [] : null,
    };
    // Build CSP header string
    const cspHeader = Object.entries(cspDirectives)
        .filter(([_, value]) => value !== null)
        .map(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
            return `${key} ${value.join(" ")}`;
        }
        else if (Array.isArray(value) && value.length === 0) {
            return key;
        }
        return "";
    })
        .filter(Boolean)
        .join("; ");
    res.setHeader("Content-Security-Policy", cspHeader);
    next();
};
exports.securityHeaders = securityHeaders;
/** Enhanced rate limiting with environment-based configuration */
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: process.env.NODE_ENV === "production" ? 5 : 10, // Stricter in production
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later.",
        retryAfter: "60 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        // Use IP + user agent for more precise rate limiting
        return `${req.ip}-${req.get("user-agent")?.substring(0, 50) || ""}`;
    },
});
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 100 : 200, // Adjust based on environment
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
        retryAfter: "60 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `${req.ip}-${req.get("user-agent")?.substring(0, 50) || ""}`;
    },
});
/** API-specific rate limiting */
exports.apiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 50 : 100,
    message: {
        success: false,
        message: "Too many API requests. Please try again later.",
        retryAfter: "60 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/** Enhanced request logger */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get("user-agent"),
            contentLength: res.get("content-length"),
            referrer: req.get("referer"),
        };
        if (process.env.NODE_ENV === "development") {
            console.log(`${logData.timestamp} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
        }
        // Log errors separately
        if (res.statusCode >= 400) {
            console.error("Request Error:", logData);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
/** Enhanced error handler with more specific error types */
const errorHandler = (error, req, res, next) => {
    console.error("Error occurred:", {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("user-agent"),
    });
    let statusCode = 500;
    let message = "Internal server error";
    let details = null;
    // Handle different error types
    if (error.name === "ValidationError") {
        statusCode = 400;
        message = "Validation failed";
        details = error.errors;
    }
    else if (error.name === "UnauthorizedError" || error.message === "Unauthorized") {
        statusCode = 401;
        message = "Unauthorized access";
    }
    else if (error.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }
    else if (error.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired";
    }
    else if (error.name === "RateLimitError") {
        statusCode = 429;
        message = "Too many requests";
    }
    else if (error.code === "P2002") { // Prisma unique constraint violation
        statusCode = 409;
        message = "Resource already exists";
    }
    else if (error.code === "P2025") { // Prisma record not found
        statusCode = 404;
        message = "Resource not found";
    }
    const response = {
        success: false,
        message,
    };
    // Add details in development
    if (process.env.NODE_ENV === "development") {
        response.stack = error.stack;
        response.details = details || error.message;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
/** CSRF protection middleware (optional) */
const csrfProtection = (req, res, next) => {
    // Skip CSRF for API routes or if already validated
    if (req.path.startsWith('/api/') || req.method === 'GET' || req.method === 'OPTIONS' || req.method === 'HEAD') {
        return next();
    }
    // Check CSRF token for state-changing requests
    const csrfToken = req.header('X-CSRF-Token') || req.body._csrf;
    if (!csrfToken) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token missing'
        });
    }
    // Here you would validate the CSRF token against the session
    // For now, we'll just continue
    next();
};
exports.csrfProtection = csrfProtection;
//# sourceMappingURL=requireRole.js.map