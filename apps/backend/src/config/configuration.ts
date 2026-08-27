import { registerAs } from '@nestjs/config';

/**
 * Strongly-typed config namespaces. Inject with `ConfigService.get('app.port')`
 * or via the dedicated `@nestjs/config` namespace tokens.
 */
export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'Aabha',
  env: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  publicWebUrl: process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000',
  publicApiUrl: process.env.PUBLIC_API_URL ?? 'http://localhost:4000',
}));

export const authConfig = registerAs('auth', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
  accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? '',
    get enabled() {
      return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    },
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID ?? '',
    appSecret: process.env.FACEBOOK_APP_SECRET ?? '',
    callbackUrl: process.env.FACEBOOK_CALLBACK_URL ?? '',
    get enabled() {
      return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
    },
  },
}));

export const otpConfig = registerAs('otp', () => ({
  provider: process.env.SMS_PROVIDER ?? 'console',
  senderId: process.env.SMS_SENDER_ID ?? 'AABHA',
  ttlSeconds: Number(process.env.OTP_TTL_SECONDS ?? 300),
  length: Number(process.env.OTP_LENGTH ?? 6),
  maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL ?? '',
  enabled: Boolean(process.env.REDIS_URL),
}));
