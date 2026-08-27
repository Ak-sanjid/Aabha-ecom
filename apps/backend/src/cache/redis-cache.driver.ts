import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { CacheDriver } from './cache.driver';

@Injectable()
export class RedisCacheDriver extends CacheDriver {
  private readonly logger = new Logger(RedisCacheDriver.name);
  private readonly client: Redis;

  constructor(url: string) {
    super();
    this.client = new Redis(url, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 200, 3000),
    });
    this.client.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (ttlSeconds) await this.client.set(key, raw, 'EX', ttlSeconds);
    else await this.client.set(key, raw);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const value = await this.client.incr(key);
    if (value === 1 && ttlSeconds) await this.client.expire(key, ttlSeconds);
    return value;
  }

  async keys(prefix: string): Promise<string[]> {
    return this.client.keys(`${prefix}*`);
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}
