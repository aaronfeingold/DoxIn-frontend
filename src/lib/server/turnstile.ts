/**
 * Server-side Turnstile CAPTCHA verification
 *
 * This file contains server-only utilities for verifying Cloudflare Turnstile tokens.
 * DO NOT import this file in client components.
 *
 * Use in:
 * - API routes
 * - Server actions
 * - Server components (use server-only package to enforce)
 *
 * Security Requirements (per Cloudflare docs):
 * - Tokens expire after 300 seconds (5 minutes)
 * - Each token can only be validated once
 * - Server-side validation is mandatory
 * - Never expose secret keys in client-side code
 *
 * Reference: https://developers.cloudflare.com/turnstile/get-started/
 */

import { serverConfig } from "@/config/server";

interface TurnstileVerificationResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

interface VerificationResult {
  success: boolean;
  error?: string;
  errorCodes?: string[];
  challengeTimestamp?: string;
  hostname?: string;
}

/**
 * Verifies a Turnstile token with Cloudflare's Siteverify API
 *
 * @param token - The token returned from the Turnstile widget
 * @param remoteIp - Optional IP address of the user (for additional validation)
 * @returns Verification result with success status and optional error details
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<VerificationResult> {
  const secretKey = serverConfig.turnstileSecretKey;

  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY not set");
    // In development, we might want to skip verification
    if (serverConfig.isDevelopment) {
      console.warn("Skipping CAPTCHA verification in development mode");
      return { success: true };
    }
    return { success: false, error: "CAPTCHA configuration error" };
  }

  // Validate token format (basic check)
  if (!token || typeof token !== "string" || token.trim() === "") {
    return {
      success: false,
      error: "Invalid token format",
    };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      console.error(
        `Turnstile API returned status ${response.status}: ${response.statusText}`
      );
      return {
        success: false,
        error: "CAPTCHA verification service error",
      };
    }

    const data: TurnstileVerificationResponse = await response.json();

    if (!data.success) {
      const errorCodes = data["error-codes"] || [];
      console.error("Turnstile verification failed:", {
        errorCodes,
        hostname: data.hostname,
      });

      // Map Cloudflare error codes to user-friendly messages
      let errorMessage = "CAPTCHA verification failed";
      if (errorCodes.includes("timeout-or-duplicate")) {
        errorMessage = "CAPTCHA token expired or already used";
      } else if (errorCodes.includes("invalid-input-response")) {
        errorMessage = "Invalid CAPTCHA token";
      } else if (errorCodes.includes("bad-request")) {
        errorMessage = "Invalid CAPTCHA request";
      }

      return {
        success: false,
        error: errorMessage,
        errorCodes,
      };
    }

    // Successful verification
    return {
      success: true,
      challengeTimestamp: data.challenge_ts,
      hostname: data.hostname,
    };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return {
      success: false,
      error: "CAPTCHA verification error",
    };
  }
}
