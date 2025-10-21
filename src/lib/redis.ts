/**
 * Redis Client Configuration
 *
 * Connects to Redis instance (container or cloud) for:
 * - Session storage (Better Auth) - DB 2
 * - Rate limiting - DB 0
 * - Caching - DB 0
 * - WebSocket pub/sub - DB 0
 *
 * Note: Redis supports multiple databases (0-15) within a single instance.
 *
 * Environment Variables:
 * - REDIS_URL: Full Redis connection URL (redis://host:port)
 * - REDIS_HOST: Redis host (default: localhost)
 * - REDIS_PORT: Redis port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - REDIS_SESSION_DB: Database number for sessions (default: 2)
 */

import Redis from "ioredis";

// Singleton pattern for Redis connections per database
const redisClients: Map<number, Redis> = new Map();

/**
 * Get Redis client for a specific database
 * @param db Database number (0-15, default: 0)
 * @returns Redis client instance
 */
export function getRedisClient(db: number = 0): Redis {
  // Return existing client if already created
  if (redisClients.has(db)) {
    return redisClients.get(db)!;
  }

  let redis: Redis;

  // Check if Redis URL is provided (full connection string)
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      db, // Select database
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
      db, // Select database
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }

  // Handle connection events
  redis.on("connect", () => {
    console.log(`Redis connected successfully (DB ${db})`);
  });

  redis.on("error", (error) => {
    console.error(`Redis connection error (DB ${db}):`, error);
  });

  redis.on("close", () => {
    console.log(`Redis connection closed (DB ${db})`);
  });

  // Cache the client
  redisClients.set(db, redis);

  return redis;
}

/**
 * Get Redis client for sessions (DB 2)
 * Used by Better Auth secondaryStorage
 */
export function getSessionRedisClient(): Redis {
  const sessionDb = parseInt(process.env.REDIS_SESSION_DB || "2", 10);
  return getRedisClient(sessionDb);
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis() {
  for (const [db, client] of redisClients.entries()) {
    await client.quit();
    console.log(`Redis connection closed (DB ${db})`);
  }
  redisClients.clear();
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
