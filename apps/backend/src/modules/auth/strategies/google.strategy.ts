import { Injectable, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';

/**
 * Google OAuth. The strategy is only registered when credentials exist, so a
 * developer without Google keys can still boot the API (see AuthModule).
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('auth.google.clientId') || 'disabled',
      clientSecret: config.get<string>('auth.google.clientSecret') || 'disabled',
      callbackURL:
        config.get<string>('auth.google.callbackUrl') ||
        `${config.get<string>('app.publicApiUrl')}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    done(null, {
      provider: 'GOOGLE' as const,
      providerUserId: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      displayName: profile.displayName ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
      raw: profile._json,
    });
  }
}
