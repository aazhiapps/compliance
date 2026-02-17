import Redis from "ioredis";

/**
 * Redis client configuration for caching and job queue
 * Supports both single instance and cluster modes
 */

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  db: parseInt(process.env.REDIS_DB || "0"),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
  enableReadyCheck: false,
  enableOfflineQueue: true,
  lazyConnect: true,
};

// Initialize Redis client
export const redisClient = new Redis(redisConfig);

// Connection event handlers
redisClient.on("connect", () => {
  console.log("Redis connected successfully");
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redisClient.on("close", () => {
  console.log("Redis connection closed");
});

/**
 * Cache key builder with namespace to avoid collisions
 */
export const cacheKeys = {
  // Admin stats cache
  admin: {
    stats: "admin:stats",
    clientsCount: "admin:stats:clients_count",
    pendingApplications: "admin:stats:pending_apps",
    revenue: "admin:stats:revenue",
    totalUsers: "admin:stats:total_users",
  },

  // Client-specific cache
  client: (clientId: string) => ({
    filings: `client:${clientId}:filings`,
    invoices: `client:${clientId}:invoices`,
    summary: (month: string) => `client:${clientId}:summary:${month}`,
    riskScore: `client:${clientId}:risk_score`,
  }),

  // User cache
  user: (userId: string) => ({
    notificationsUnread: `user:${userId}:notifications:unread`,
    profile: `user:${userId}:profile`,
  }),

  // GST data cache
  gst: {
    rules: (ruleCode: string) => `gst:rules:${ruleCode}`,
    dueDates: (fy: string) => `gst:due_dates:${fy}`,
    allRules: "gst:all_rules",
  },

  // Report cache
  report: (reportId: string) => `report:${reportId}`,

  // Session cache
  session: (sessionId: string) => `session:${sessionId}`,
};

/**
 * Cache operations wrapper
 */
export const cacheService = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set value in cache with TTL (seconds)
   */
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await redisClient.setex(key, ttl, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  },

  /**
   * Delete cache key
   */
  async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  },

  /**
   * Delete multiple keys (pattern matching)
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) return 0;
      return await redisClient.del(...keys);
    } catch (error) {
      console.error(
        `Cache pattern delete error for pattern ${pattern}:`,
        error,
      );
      return 0;
    }
  },

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await redisClient.incrby(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Flush all cache (use with caution)
   */
  async flush(): Promise<void> {
    try {
      await redisClient.flushdb();
      console.log("Cache flushed");
    } catch (error) {
      console.error("Cache flush error:", error);
    }
  },
};

/**
 * Graceful shutdown
 */
export async function closeRedis(): Promise<void> {
  if (redisClient.status === "ready") {
    await redisClient.quit();
  }
}

export default redisClient;
