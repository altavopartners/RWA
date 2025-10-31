/**
 * Centralized API configuration
 * This ensures all API calls use the same base URL from environment variables
 */

export const getApiBaseUrl = (): string => {
  if (typeof window === "undefined") {
    // Server-side: use NEXT_PUBLIC_API_URL 
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  }
  // Client-side
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to construct API endpoints 
 * @example constructApiUrl('/api/products') → 'http://localhost:4000/api/products'
 */
export const constructApiUrl = (endpoint: string): string => {
  const base = API_BASE_URL.replace(/\/+$/, ""); // Remove trailing slashes
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

/**
 * Helper for image URLs
 * @example constructImageUrl('/uploads/product-123.jpg') → 'http://localhost:4000/uploads/product-123.jpg'
 */
export const constructImageUrl = (
  imagePath?: string | null
): string | undefined => {
  if (!imagePath) return undefined;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return constructApiUrl(imagePath);
};
