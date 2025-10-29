// client/lib/debug.ts
/**
 * Client-side debugging utility
 * Conditionally logs based on localStorage or query param
 */

const getDebugMode = (): boolean => {
  if (typeof window === "undefined") return false;

  // Check localStorage
  const stored = localStorage.getItem("DEBUG");
  if (stored !== null) return stored === "true";

  // Check URL param
  const url = new URL(window.location.href);
  const param = url.searchParams.get("debug");
  if (param !== null) {
    const enabled = param === "true" || param === "1";
    localStorage.setItem("DEBUG", enabled.toString());
    return enabled;
  }

  // Default: only in development
  return process.env.NODE_ENV === "development";
};

export const debug = {
  isEnabled: () => getDebugMode(),

  /**
   * Log component lifecycle (only in DEBUG mode)
   */
  component: (componentName: string, message: string, ...args: any[]) => {
    if (getDebugMode()) {
      console.log(`[${componentName}] ${message}`, ...args);
    }
  },

  /**
   * Log API calls (only in DEBUG mode)
   */
  api: (endpoint: string, method: string, ...args: any[]) => {
    if (getDebugMode()) {
      console.log(`[API] ${method} ${endpoint}`, ...args);
    }
  },

  /**
   * Log state changes (only in DEBUG mode)
   */
  state: (message: string, state?: any) => {
    if (getDebugMode()) {
      console.log(`[STATE] ${message}`, state);
    }
  },

  /**
   * Log errors (always)
   */
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },

  /**
   * Log warnings (always)
   */
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  /**
   * Force log regardless of DEBUG setting
   */
  always: (message: string, ...args: any[]) => {
    console.log(`[SYSTEM] ${message}`, ...args);
  },

  /**
   * Enable debugging with: debug.enable()
   * Disable with: debug.disable()
   */
  enable: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("DEBUG", "true");
      console.log("🔍 Debug mode enabled. Refresh page to see debug logs.");
    }
  },

  disable: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("DEBUG", "false");
      console.log("🔇 Debug mode disabled. Refresh page.");
    }
  },
};

export default debug;
