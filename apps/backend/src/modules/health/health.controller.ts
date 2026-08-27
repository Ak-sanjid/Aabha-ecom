import { Controller, Get, Inject } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { type CacheDriver } from 'src/cache/cache.driver';
import { Public } from 'src/common/decorators/public.decorator';
import { DRIZZLE, type Database } from 'src/db/database.module';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly cache: CacheDriver,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness/readiness probe with dependency status' })
  async health() {
    const checks: Record<string, 'up' | 'down'> = {};

    try {
      await this.db.execute(sql`select 1`);
      checks.database = 'up';
    } catch {
      checks.database = 'down';
    }

    checks.cache = (await this.cache.ping()) ? 'up' : 'down';

    const healthy = Object.values(checks).every((v) => v === 'up');
    return {
      status: healthy ? 'ok' : 'degraded',
      service: this.config.get<string>('app.name'),
      env: this.config.get<string>('app.env'),
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
