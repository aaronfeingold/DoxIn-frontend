/**
 * Server-Side Configuration
 *
 * This file contains environment variables that are ONLY available on the server.
 * These can access both server-only env vars and NEXT_PUBLIC_ prefixed vars.
 *
 * Usage:
 *   import { serverConfig } from '@/config/server';
 *   const url = serverConfig.flaskApiUrl;
 *
 * IMPORTANT: Only import this file in:
 * - API routes (app/api/route.ts files)
 * - Server Components (without use client directive)
 * - Server Actions
 * - Middleware
 */

/**
 * Flask/Python Backend API URL
 * Checks server-only FLASK_API_URL first, falls back to public var
 */
export const apiUrl = process.env.API_URL || "http://localhost:5000";

/**
 * API Version
 */
export const apiVersion = process.env.NEXT_PUBLIC_API_VERSION || "/api/v1";

/**
 * Better Auth Configuration
 */
export const betterAuthUrl =
  process.env.BETTER_AUTH_URL || "http://localhost:3000";

export const betterAuthSecret = process.env.BETTER_AUTH_SECRET;

/**
 * Email Service (Resend)
 */
export const resendApiKey = process.env.RESEND_API_KEY;

/**
 * Cloudflare Turnstile (CAPTCHA)
 */
export const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY;

/**
 * Redis Configuration
 */
export const redisUrl = process.env.REDIS_URL;

/**
 * Database URL
 */
export const databaseUrl = process.env.DATABASE_URL;

/**
 * Server Config Object
 * Use this for convenient access to all server-side config
 */
export const serverConfig = {
  apiVersion,
  apiUrl,
  baseUrl: `${apiUrl}${apiVersion}`,
  betterAuthUrl,
  betterAuthSecret,
  resendApiKey,
  turnstileSecretKey,
  redisUrl,
  databaseUrl,
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;

/**
 * Validates that required server-side environment variables are set
 * Call this at app startup to fail fast if config is missing
 */
export function validateServerConfig() {
  const errors: string[] = [];

  if (!flaskApiUrl) {
    errors.push("FLASK_API_URL or NEXT_PUBLIC_FLASK_API_URL must be set");
  }

  if (!betterAuthSecret) {
    errors.push("BETTER_AUTH_SECRET must be set");
  }

  if (errors.length > 0) {
    throw new Error(
      `Server configuration validation failed:\n${errors.join("\n")}`
    );
  }
}
