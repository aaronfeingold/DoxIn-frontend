/**
 * Rate Limiting Utilities
 *
 * Uses Redis-backed rate limiting for API protection:
 * - Access code requests (3 per 24 hours per email)
 * - Code validation attempts (5 per 15 minutes per IP)
 * - Code generation (50 per day per admin)
 * - Magic link requests (3 per 15 minutes per email)
 */

import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { getRedisClient } from "./redis";
import type { NextRequest } from "next/server";

// Rate limiter instances (lazy initialization)
let accessRequestLimiter: RateLimiterRedis | null = null;
let codeValidationLimiter: RateLimiterRedis | null = null;
let codeGenerationLimiter: RateLimiterRedis | null = null;
let magicLinkLimiter: RateLimiterRedis | null = null;

/**
 * Get rate limiter for access code requests
 * Limit: 3 requests per 24 hours per email
 */
export function getAccessRequestLimiter(): RateLimiterRedis {
  if (!accessRequestLimiter) {
    const redis = getRedisClient();
    accessRequestLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "rl:access_request",
      points: 3, // 3 requests
      duration: 60 * 60 * 24, // per 24 hours
      blockDuration: 60 * 60 * 24, // Block for 24 hours after limit
    });
  }
  return accessRequestLimiter;
}

/**
 * Get rate limiter for code validation attempts
 * Limit: 5 attempts per 15 minutes per IP
 */
export function getCodeValidationLimiter(): RateLimiterRedis {
  if (!codeValidationLimiter) {
    const redis = getRedisClient();
    codeValidationLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "rl:code_validation",
      points: 5, // 5 attempts
      duration: 60 * 15, // per 15 minutes
      blockDuration: 60 * 15, // Block for 15 minutes after limit
    });
  }
  return codeValidationLimiter;
}

/**
 * Get rate limiter for code generation
 * Limit: 50 codes per day per admin
 */
export function getCodeGenerationLimiter(): RateLimiterRedis {
  if (!codeGenerationLimiter) {
    const redis = getRedisClient();
    codeGenerationLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "rl:code_generation",
      points: 50, // 50 codes
      duration: 60 * 60 * 24, // per 24 hours
      blockDuration: 60 * 60 * 24, // Block for 24 hours after limit
    });
  }
  return codeGenerationLimiter;
}

/**
 * Get rate limiter for magic link requests
 * Limit: 3 requests per 15 minutes per email
 */
export function getMagicLinkLimiter(): RateLimiterRedis {
  if (!magicLinkLimiter) {
    const redis = getRedisClient();
    magicLinkLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "rl:magic_link",
      points: 3, // 3 requests
      duration: 60 * 15, // per 15 minutes
      blockDuration: 60 * 15, // Block for 15 minutes after limit
    });
  }
  return magicLinkLimiter;
}

/**
 * Check rate limit and consume a point
 * Returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  limiter: RateLimiterRedis,
  key: string
): Promise<{ allowed: boolean; retryAfter?: number; remaining?: number }> {
  try {
    const result = await limiter.consume(key, 1);
    return {
      allowed: true,
      remaining: result.remainingPoints,
    };
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      // Rate limit exceeded
      const retryAfterSeconds = Math.ceil(error.msBeforeNext / 1000);
      return {
        allowed: false,
        retryAfter: retryAfterSeconds,
      };
    }
    // Redis error - allow the request but log the error
    console.error("Rate limiter error:", error);
    return { allowed: true };
  }
}

/**
 * Get client IP address from Next.js request
 */
export function getClientIp(request: NextRequest): string {
  // Check various headers for IP address
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a placeholder (shouldn't happen in production)
  return "unknown";
}

/**
 * Format rate limit error response
 */
export function formatRateLimitError(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
      },
    }
  );
}
