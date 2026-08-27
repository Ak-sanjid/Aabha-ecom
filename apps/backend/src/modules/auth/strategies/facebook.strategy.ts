import { Injectable } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('auth.facebook.appId') || 'disabled',
      clientSecret: config.get<string>('auth.facebook.appSecret') || 'disabled',
      callbackURL:
        config.get<string>('auth.facebook.callbackUrl') ||
        `${config.get<string>('app.publicApiUrl')}/api/v1/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'emails', 'photos'],
      scope: ['email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: unknown, user?: unknown) => void,
  ): Promise<void> {
    done(null, {
      provider: 'FACEBOOK' as const,
      providerUserId: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      displayName: profile.displayName ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
      raw: profile._json,
    });
  }
}
