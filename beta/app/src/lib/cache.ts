// Hybrid cache system: Redis for distributed cache + in-memory for hot data
// This provides instant responses for frequently accessed data

import Redis from 'ioredis';

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Initialize Redis client (fallback to in-memory if Redis unavailable)
let redis: Redis | null = null;
try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
  });
  redis.on('error', (err) => {
    console.warn('Redis cache error (falling back to memory):', err.message);
    redis = null;
  });
} catch (error) {
  console.warn('Redis initialization failed, using in-memory cache only');
}

class HybridCache {
  private memCache = new Map<string, CacheEntry>();
  private defaultTTL = 300; // 5 minutes in seconds

  async get(key: string): Promise<any | null> {
    // Try memory cache first (fastest)
    const memEntry = this.memCache.get(key);
    if (memEntry) {
      const now = Date.now();
      if (now - memEntry.timestamp < this.defaultTTL * 1000) {
        return memEntry.data;
      }
      this.memCache.delete(key);
    }

    // Try Redis if available
    if (redis) {
      try {
        const cached = await redis.get(key);
        if (cached) {
          const data = JSON.parse(cached);
          // Store in memory for faster subsequent access
          this.memCache.set(key, { data, timestamp: Date.now() });
          return data;
        }
      } catch (error) {
        // Fallback to memory cache only
      }
    }

    return null;
  }

  async set(key: string, data: any, ttl?: number): Promise<void> {
    const ttlSeconds = ttl || this.defaultTTL;
    
    // Store in memory cache
    this.memCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Auto-expire from memory
    setTimeout(() => {
      this.memCache.delete(key);
    }, ttlSeconds * 1000);

    // Store in Redis if available
    if (redis) {
      try {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
      } catch (error) {
        // Continue with memory cache only
      }
    }
  }

  async clear(): Promise<void> {
    this.memCache.clear();
    if (redis) {
      try {
        await redis.flushdb();
      } catch (error) {
        // Continue with memory cache clear
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    const memDeleted = this.memCache.delete(key);
    if (redis) {
      try {
        await redis.del(key);
      } catch (error) {
        // Continue with memory cache delete
      }
    }
    return memDeleted;
  }

  // Clear cache entries for a specific user
  async clearUserCache(userId: string): Promise<void> {
    // Clear from memory
    for (const [key] of this.memCache) {
      if (key.includes(userId)) {
        this.memCache.delete(key);
      }
    }
    
    // Clear from Redis
    if (redis) {
      try {
        const keys = await redis.keys(`*${userId}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (error) {
        // Continue with memory cache clear
      }
    }
  }
}

// Export singleton instance
export const apiCache = new HybridCache();

// Cache key generators
export const cacheKeys = {
  userSession: (userId: string) => `session:${userId}`,
  userKyc: (userId: string) => `kyc:${userId}`,
  userWallets: (userId: string) => `wallets:${userId}`,
  properties: (filters?: string) => `properties:${filters || 'all'}`,
  property: (id: string) => `property:${id}`,
  notifications: (userId: string) => `notifications:${userId}`,
  notificationCount: (userId: string) => `notifications:count:${userId}`,
};

// Helper to cache API responses
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = await apiCache.get(key);
  if (cached !== null) {
    return cached as T;
  }

  const data = await fetcher();
  await apiCache.set(key, data, ttl);
  return data;
}