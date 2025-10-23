// server/utils/logger.ts
// Production-ready logging utility using Winston
//
// Replaces console.log with structured logging that:
// - Writes to files in production
// - Includes timestamps and metadata
// - Supports different log levels (error, warn, info, debug)
// - Can integrate with external services (Datadog, Sentry, etc.)

import winston from "winston";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProduction ? "info" : "debug");

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development (more readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(
    (info: winston.Logform.TransformableInfo & { timestamp?: string }) => {
      const { timestamp, level, message, ...meta } = info as any;
      let msg = `${timestamp ?? ""} [${String(level)}]: ${String(message)}`;
      if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
      }
      return msg;
    }
  )
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always in development, optional in production)
if (!isProduction || process.env.LOG_TO_CONSOLE === "true") {
  transports.push(
    new winston.transports.Console({
      format: isProduction ? logFormat : consoleFormat,
    })
  );
}

// File transports (production only)
if (isProduction) {
  const logDir = process.env.LOG_DIR || path.join(__dirname, "../../logs");

  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Handle uncaught exceptions and rejections
if (isProduction) {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || "./logs", "exceptions.log"),
    })
  );

  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || "./logs", "rejections.log"),
    })
  );
}

// Helper methods with proper typing
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),

  // Specific use-case helpers
  request: (
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    meta?: any
  ) => {
    logger.info("HTTP Request", {
      method,
      url,
      statusCode,
      duration,
      ...meta,
    });
  },

  auth: (event: string, userId?: string, meta?: any) => {
    logger.info("Auth Event", {
      event,
      userId,
      ...meta,
    });
  },

  db: (operation: string, model: string, duration?: number, meta?: any) => {
    logger.debug("Database Operation", {
      operation,
      model,
      duration,
      ...meta,
    });
  },
};

export default logger;
