/**
 * Cache/session store contract. Two drivers implement it:
 *  - RedisCacheDriver (production: sessions, guest carts, OTP throttles)
 *  - MemoryCacheDriver (local dev / CI when REDIS_URL is unset)
 * Swapping drivers must never require a change in calling code.
 */
export abstract class CacheDriver {
  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  abstract del(key: string): Promise<void>;
  abstract incr(key: string, ttlSeconds?: number): Promise<number>;
  abstract keys(prefix: string): Promise<string[]>;
  abstract ping(): Promise<boolean>;
  abstract close(): Promise<void>;
}
