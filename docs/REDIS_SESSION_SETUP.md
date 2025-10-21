# Redis Session Storage Setup Guide

## Overview

This guide explains how to configure Redis-backed session storage for Better Auth to enable stateless, horizontally scalable Next.js deployments.

## Current Architecture

**Current State:**
- Better Auth uses PostgreSQL for session storage via Prisma adapter
- Sessions are stored in the `session` table
- Works fine for single-server deployments

**Target State:**
- Sessions stored in Redis for fast access
- PostgreSQL used only for user data and access codes
- Multiple Next.js instances can share sessions via Redis

## Why Redis for Sessions?

1. **Speed**: Sub-millisecond session lookups (vs 10-50ms for PostgreSQL)
2. **Horizontal Scaling**: Multiple app servers share same session store
3. **Automatic Expiry**: Redis TTL handles session cleanup automatically
4. **Reduced DB Load**: Offload frequent session reads from PostgreSQL

## Option 1: Custom Redis Session Adapter (Recommended)

Since Better Auth v1.3.23 may not have built-in Redis adapter, we can create a custom implementation.

### Step 1: Update Redis Client

The Redis client is already set up at `src/lib/redis.ts`. It works with your existing Redis container.

### Step 2: Create Custom Session Store

Create `src/lib/redis-session-store.ts`:

```typescript
import { getRedisClient } from "./redis";

interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

export class RedisSessionStore {
  private redis = getRedisClient();
  private readonly keyPrefix = "session:";
  private readonly userSessionPrefix = "user-sessions:";

  /**
   * Create a new session
   */
  async createSession(session: Session): Promise<void> {
    const key = `${this.keyPrefix}${session.token}`;
    const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);

    // Store session data
    await this.redis.setex(key, ttl, JSON.stringify(session));

    // Track user's sessions for multi-device support
    await this.redis.sadd(
      `${this.userSessionPrefix}${session.userId}`,
      session.token
    );
    await this.redis.expire(
      `${this.userSessionPrefix}${session.userId}`,
      ttl
    );
  }

  /**
   * Get session by token
   */
  async getSession(token: string): Promise<Session | null> {
    const key = `${this.keyPrefix}${token}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      const session = JSON.parse(data);

      // Check if expired
      if (new Date(session.expiresAt) < new Date()) {
        await this.deleteSession(token);
        return null;
      }

      return session;
    } catch (error) {
      console.error("Error parsing session data:", error);
      return null;
    }
  }

  /**
   * Update session (extend expiry)
   */
  async updateSession(
    token: string,
    updates: Partial<Session>
  ): Promise<void> {
    const session = await this.getSession(token);

    if (!session) {
      throw new Error("Session not found");
    }

    const updatedSession = { ...session, ...updates };
    const key = `${this.keyPrefix}${token}`;
    const ttl = Math.floor(
      (updatedSession.expiresAt.getTime() - Date.now()) / 1000
    );

    await this.redis.setex(key, ttl, JSON.stringify(updatedSession));
  }

  /**
   * Delete session
   */
  async deleteSession(token: string): Promise<void> {
    const session = await this.getSession(token);

    if (session) {
      // Remove from user's session list
      await this.redis.srem(
        `${this.userSessionPrefix}${session.userId}`,
        token
      );
    }

    await this.redis.del(`${this.keyPrefix}${token}`);
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<void> {
    const tokens = await this.redis.smembers(
      `${this.userSessionPrefix}${userId}`
    );

    if (tokens.length > 0) {
      const keys = tokens.map((token) => `${this.keyPrefix}${token}`);
      await this.redis.del(...keys);
      await this.redis.del(`${this.userSessionPrefix}${userId}`);
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    const tokens = await this.redis.smembers(
      `${this.userSessionPrefix}${userId}`
    );

    const sessions: Session[] = [];

    for (const token of tokens) {
      const session = await this.getSession(token);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Clean up expired sessions (called periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    // Redis automatically handles TTL expiry
    // This method is here for compatibility but is a no-op with Redis
    return 0;
  }
}

export const redisSessionStore = new RedisSessionStore();
```

### Step 3: Integrate with Better Auth

Update `src/lib/auth.ts` to use Redis session store:

```typescript
// Add at the top
import { redisSessionStore } from "./redis-session-store";

// Modify the betterAuth configuration
export const auth = betterAuth({
  // ... existing config ...

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day

    // Custom session hooks to use Redis
    async createSession(session) {
      await redisSessionStore.createSession({
        userId: session.userId,
        token: session.token,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      });
      return session;
    },

    async getSession(token) {
      return await redisSessionStore.getSession(token);
    },

    async updateSession(token, updates) {
      await redisSessionStore.updateSession(token, updates);
    },

    async deleteSession(token) {
      await redisSessionStore.deleteSession(token);
    },
  },
});
```

### Step 4: Hybrid Approach (Recommended for Production)

For production, use a hybrid approach:
- Redis for session storage (speed)
- PostgreSQL for user data (durability)

This gives you the best of both worlds.

## Option 2: Use Better Auth with Redis Plugin (If Available)

Check Better Auth documentation for Redis adapter:

```bash
# If Redis adapter exists
pnpm add better-auth-redis-adapter
# or
pnpm add @better-auth/redis-adapter
```

Then update `src/lib/auth.ts`:

```typescript
import { redisAdapter } from "better-auth-redis-adapter";
import { getRedisClient } from "./redis";

export const auth = betterAuth({
  database: redisAdapter(getRedisClient(), {
    // Use Redis for sessions only
    sessions: true,
    // Keep PostgreSQL for user data
    users: false,
  }),
  // ... rest of config
});
```

## Testing Redis Session Storage

### 1. Start Multiple Next.js Instances

Terminal 1:
```bash
PORT=3000 pnpm dev
```

Terminal 2:
```bash
PORT=3001 pnpm dev
```

### 2. Test Session Sharing

1. Sign in on http://localhost:3000
2. Copy your session cookie
3. Visit http://localhost:3001
4. You should be automatically authenticated (session shared via Redis)

### 3. Monitor Redis

```bash
# Connect to Redis CLI
redis-cli

# Watch sessions being created
MONITOR

# List all session keys
KEYS session:*

# Get session data
GET session:YOUR_TOKEN

# Check TTL
TTL session:YOUR_TOKEN
```

## Deployment Configuration

### Environment Variables

Add to production `.env`:

```bash
# Redis Session Storage
REDIS_URL=redis://your-redis-host:6379
# OR for Redis with TLS
REDIS_URL=rediss://your-redis-host:6380
# OR for Upstash Redis
REDIS_URL=rediss://:YOUR_PASSWORD@your-upstash-url:6379

# Keep PostgreSQL for user data
DATABASE_URL=postgresql://user:password@host:5432/db
```

### Load Balancer Setup

Configure your load balancer (e.g., nginx):

```nginx
upstream nextjs_backend {
    least_conn;  # Route to server with fewest connections
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://nextjs_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Performance Benchmarks

Expected performance improvements:

| Metric | PostgreSQL | Redis | Improvement |
|--------|-----------|-------|-------------|
| Session Read | ~10-50ms | <1ms | **10-50x faster** |
| Session Write | ~20-100ms | ~1ms | **20-100x faster** |
| Concurrent Users | Limited by DB connections | 10,000+ | **High scalability** |
| Session Expiry | Manual cleanup job | Automatic (TTL) | **No maintenance** |

## Monitoring

### Redis Metrics to Watch

```bash
# Check Redis info
redis-cli INFO

# Watch memory usage
redis-cli INFO memory

# Check connected clients
redis-cli INFO clients

# Monitor slow queries
redis-cli SLOWLOG GET 10
```

### Application Metrics

Track these in your app:
- Session creation rate
- Session hit rate (Redis) vs miss rate
- Average session lookup time
- Number of active sessions
- Session expiry rate

## Troubleshooting

### Sessions Not Persisting

**Problem**: User gets logged out when switching servers

**Solutions**:
1. Verify Redis is accessible from all app servers
2. Check Redis connection in logs
3. Ensure session cookies are not server-specific
4. Verify same BETTER_AUTH_SECRET across all instances

### Redis Memory Issues

**Problem**: Redis running out of memory

**Solutions**:
1. Increase Redis memory limit
2. Reduce session TTL
3. Implement session limit per user
4. Use Redis eviction policy: `maxmemory-policy allkeys-lru`

### Session Sync Delays

**Problem**: Session updates not immediately visible across servers

**Solutions**:
1. Reduce session update age
2. Check Redis network latency
3. Consider using Redis Cluster for high availability
4. Implement session versioning

## Migration Checklist

- [ ] Set up Redis instance (container, Upstash, or managed service)
- [ ] Test Redis connection from application
- [ ] Implement Redis session store class
- [ ] Update Better Auth configuration
- [ ] Test session creation and retrieval
- [ ] Test session sharing across multiple instances
- [ ] Set up monitoring for Redis
- [ ] Configure load balancer
- [ ] Update deployment scripts
- [ ] Test failover scenarios
- [ ] Monitor production metrics

## Next Steps

1. **Choose Implementation**: Custom adapter or wait for official plugin
2. **Set Up Redis**: Use existing container or deploy managed Redis
3. **Test Locally**: Run multiple Next.js instances
4. **Deploy**: Update production with Redis configuration
5. **Monitor**: Track session metrics and Redis performance

## Resources

- [Better Auth Documentation](https://better-auth.com)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Session Management Security](https://owasp.org/www-community/vulnerabilities/Session_fixation)
