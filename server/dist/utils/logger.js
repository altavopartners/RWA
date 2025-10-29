"use strict";
// server/utils/logger.ts
// Production-ready logging utility using Winston
//
// Replaces console.log with structured logging that:
// - Writes to files in production
// - Includes timestamps and metadata
// - Supports different log levels (error, warn, info, debug)
// - Can integrate with external services (Datadog, Sentry, etc.)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProduction ? "info" : "debug");
// Define log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Console format for development (more readable)
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: "HH:mm:ss" }), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let msg = `${timestamp ?? ""} [${String(level)}]: ${String(message)}`;
    if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
}));
// Create transports array
const transports = [];
// Console transport (always in development, optional in production)
if (!isProduction || process.env.LOG_TO_CONSOLE === "true") {
    transports.push(new winston_1.default.transports.Console({
        format: isProduction ? logFormat : consoleFormat,
    }));
}
// File transports (production only)
if (isProduction) {
    const logDir = process.env.LOG_DIR || path_1.default.join(__dirname, "../../logs");
    // Error logs
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, "error.log"),
        level: "error",
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
    // Combined logs
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, "combined.log"),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: logLevel,
    format: logFormat,
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
});
// Handle uncaught exceptions and rejections
if (isProduction) {
    exports.logger.exceptions.handle(new winston_1.default.transports.File({
        filename: path_1.default.join(process.env.LOG_DIR || "./logs", "exceptions.log"),
    }));
    exports.logger.rejections.handle(new winston_1.default.transports.File({
        filename: path_1.default.join(process.env.LOG_DIR || "./logs", "rejections.log"),
    }));
}
// Helper methods with proper typing
exports.log = {
    error: (message, meta) => exports.logger.error(message, meta),
    warn: (message, meta) => exports.logger.warn(message, meta),
    info: (message, meta) => exports.logger.info(message, meta),
    debug: (message, meta) => exports.logger.debug(message, meta),
    // Specific use-case helpers
    request: (method, url, statusCode, duration, meta) => {
        exports.logger.info("HTTP Request", {
            method,
            url,
            statusCode,
            duration,
            ...meta,
        });
    },
    auth: (event, userId, meta) => {
        exports.logger.info("Auth Event", {
            event,
            userId,
            ...meta,
        });
    },
    db: (operation, model, duration, meta) => {
        exports.logger.debug("Database Operation", {
            operation,
            model,
            duration,
            ...meta,
        });
    },
};
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map