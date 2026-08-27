import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { eq } from 'drizzle-orm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DRIZZLE, type Database } from 'src/db/database.module';
import * as schema from 'src/db/schema';
import type { AuthenticatedUser, JwtPayload } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: { cookies?: Record<string, string> }) => req?.cookies?.aabha_access ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('auth.accessSecret') ?? 'dev-access-secret-change-me',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.db.query.users.findFirst({ where: eq(schema.users.id, payload.sub) });
    if (!user || !user.isActive) throw new UnauthorizedException('Session is no longer valid');

    return {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: payload.permissions ?? [],
      fullName: user.fullName,
      locale: user.locale,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
