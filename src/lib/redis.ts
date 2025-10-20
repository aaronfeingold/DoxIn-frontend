/**
 * Redis Client Configuration
 *
 * Connects to Redis instance (container or cloud) for:
 * - Session storage (Better Auth)
 * - Rate limiting
 * - Caching
 *
 * Environment Variables:
 * - REDIS_URL: Full Redis connection URL (redis://host:port)
 * - REDIS_HOST: Redis host (default: localhost)
 * - REDIS_PORT: Redis port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 */

import Redis from "ioredis";

// Singleton pattern for Redis connection
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (redis) {
    return redis;
  }

  // Check if Redis URL is provided (full connection string)
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // Reconnect on error
      reconnectOnError(err) {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          // Reconnect if Redis is in readonly mode
          return true;
        }
        return false;
      },
    });
  } else {
    // Fall back to individual connection parameters
    const host = process.env.REDIS_HOST || "localhost";
    const port = parseInt(process.env.REDIS_PORT || "6379", 10);
    const password = process.env.REDIS_PASSWORD;

    redis = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }

  // Handle connection events
  redis.on("connect", () => {
    console.log("✅ Redis connected successfully");
  });

  redis.on("error", (error) => {
    console.error("❌ Redis connection error:", error);
  });

  redis.on("close", () => {
    console.log("🔌 Redis connection closed");
  });

  return redis;
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

/**
 * Health check for Redis connection
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const pong = await client.ping();
    return pong === "PONG";
  } catch (error) {
    console.error("Redis health check failed:", error);
    return false;
  }
}
