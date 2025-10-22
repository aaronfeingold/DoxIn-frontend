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
 * API URL - this will become the ELB URL eventually with HTTPS
 */
export const apiUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * API (external)Version
 */
export const apiVersion = process.env.NEXT_PUBLIC_API_VERSION || "v0";
export const apiVer = `/api/${apiVersion}`;
/**
 * NextJS API Version
 */
export const nextApiVersion = process.env.NEXT_PUBLIC_NEXT_API_VERSION || "v0";
export const nextApiVer = `/api/${nextApiVersion}`;
/**
 * Cloudflare Turnstile Site Key (CAPTCHA)
 */
export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Client Config Object
 * Use this for convenient access to all client-side config
 */
export const clientConfig = {
  apiUrl,
  apiVersion,
  apiVer,
  nextApiVersion,
  nextApiVer,
  baseUrl: `${apiUrl}${apiVer}`,
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

  if (!apiUrl) {
    errors.push("NEXT_PUBLIC_API_URL must be set");
  }

  if (errors.length > 0) {
    console.error(
      `Client configuration validation failed:\n${errors.join("\n")}`
    );
    return false;
  }

  return true;
}
