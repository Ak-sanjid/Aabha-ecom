import { Global, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheDriver } from './cache.driver';
import { MemoryCacheDriver } from './memory-cache.driver';
import { RedisCacheDriver } from './redis-cache.driver';

@Global()
@Module({
  providers: [
    {
      provide: CacheDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService): CacheDriver => {
        const url = config.get<string>('redis.url');
        const logger = new Logger('CacheModule');
        if (url) {
          logger.log('Cache driver: Redis');
          return new RedisCacheDriver(url);
        }
        logger.warn('REDIS_URL not set — falling back to in-process memory cache (dev only)');
        return new MemoryCacheDriver();
      },
    },
  ],
  exports: [CacheDriver],
})
export class CacheModule implements OnApplicationShutdown {
  constructor(private readonly driver: CacheDriver) {}

  async onApplicationShutdown(): Promise<void> {
    await this.driver.close();
  }
}
