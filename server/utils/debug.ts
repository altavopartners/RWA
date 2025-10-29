// server/utils/debug.ts
/**
 * Debugging utility - conditionally logs based on DEBUG environment variable
 * Helps reduce noise in production while keeping debug info available
 */

const DEBUG =
  process.env.DEBUG === "true" || process.env.NODE_ENV === "development";

export const debug = {
  /**
   * Log info messages (only in DEBUG mode)
   */
  info: (message: string, ...args: any[]) => {
    if (DEBUG) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Log warn messages (always)
   */
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  /**
   * Log error messages (always)
   */
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  /**
   * Log blockchain transaction info (only in DEBUG mode)
   */
  transaction: (description: string, ...args: any[]) => {
    if (DEBUG) {
      console.log(`[TXN] ${description}`, ...args);
    }
  },

  /**
   * Log deployment info (only in DEBUG mode)
   */
  deploy: (description: string, ...args: any[]) => {
    if (DEBUG) {
      console.log(`[DEPLOY] ${description}`, ...args);
    }
  },

  /**
   * Log service operations (only in DEBUG mode)
   */
  service: (service: string, operation: string, ...args: any[]) => {
    if (DEBUG) {
      console.log(`[${service}] ${operation}`, ...args);
    }
  },

  /**
   * Force log regardless of DEBUG setting (for critical info)
   */
  always: (message: string, ...args: any[]) => {
    console.log(`[SYSTEM] ${message}`, ...args);
  },
};

export default debug;
