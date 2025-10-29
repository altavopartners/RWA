"use strict";
// server/utils/debug.ts
/**
 * Debugging utility - conditionally logs based on DEBUG environment variable
 * Helps reduce noise in production while keeping debug info available
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = void 0;
const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
exports.debug = {
    /**
     * Log info messages (only in DEBUG mode)
     */
    info: (message, ...args) => {
        if (DEBUG) {
            console.log(`[INFO] ${message}`, ...args);
        }
    },
    /**
     * Log warn messages (always)
     */
    warn: (message, ...args) => {
        console.warn(`[WARN] ${message}`, ...args);
    },
    /**
     * Log error messages (always)
     */
    error: (message, ...args) => {
        console.error(`[ERROR] ${message}`, ...args);
    },
    /**
     * Log blockchain transaction info (only in DEBUG mode)
     */
    transaction: (description, ...args) => {
        if (DEBUG) {
            console.log(`[TXN] ${description}`, ...args);
        }
    },
    /**
     * Log deployment info (only in DEBUG mode)
     */
    deploy: (description, ...args) => {
        if (DEBUG) {
            console.log(`[DEPLOY] ${description}`, ...args);
        }
    },
    /**
     * Log service operations (only in DEBUG mode)
     */
    service: (service, operation, ...args) => {
        if (DEBUG) {
            console.log(`[${service}] ${operation}`, ...args);
        }
    },
    /**
     * Force log regardless of DEBUG setting (for critical info)
     */
    always: (message, ...args) => {
        console.log(`[SYSTEM] ${message}`, ...args);
    },
};
exports.default = exports.debug;
//# sourceMappingURL=debug.js.map