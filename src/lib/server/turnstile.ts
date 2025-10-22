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
 */

import { serverConfig } from "@/config/server";

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
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

    const data = await response.json();

    if (!data.success) {
      console.error("Turnstile verification failed:", data["error-codes"]);
      return {
        success: false,
        error: "CAPTCHA verification failed",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return {
      success: false,
      error: "CAPTCHA verification error",
    };
  }
}
