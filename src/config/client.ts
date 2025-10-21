/**
 * Client-Side Configuration
 *
 * This file contains environment variables that are available on the CLIENT.
 * Only NEXT_PUBLIC_ prefixed environment variables can be used here.
 *
 * Usage:
 *   import { clientConfig } from '@/config/client';
 *   const url = clientConfig.flaskApiUrl;
 *
 * Safe to import in:
 * - Client Components ('use client')
 * - Server Components
 * - API routes
 * - Anywhere in the app
 */

/**
 * Flask/Python Backend API URL (client-accessible)
 */
export const flaskApiUrl = process.env.NEXT_PUBLIC_FLASK_API_URL;

/**
 * Backend URL for WebSocket connections
 */
export const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_FLASK_API_URL ||
  "http://localhost:5000";

/**
 * Cloudflare Turnstile Site Key (CAPTCHA)
 */
export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Client Config Object
 * Use this for convenient access to all client-side config
 */
export const clientConfig = {
  flaskApiUrl,
  backendUrl,
  turnstileSiteKey,
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;

/**
 * Validates that required client-side environment variables are set
 * Call this in client components to provide helpful error messages
 */
export function validateClientConfig() {
  const errors: string[] = [];

  if (!flaskApiUrl) {
    errors.push("NEXT_PUBLIC_FLASK_API_URL must be set");
  }

  if (errors.length > 0) {
    console.error(
      `Client configuration validation failed:\n${errors.join("\n")}`
    );
    return false;
  }

  return true;
}
