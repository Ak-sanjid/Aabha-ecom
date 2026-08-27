import { Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * OAuth strategies are registered conditionally: without credentials Passport
 * would throw at boot, and a developer must still be able to run the API.
 */
const oauthProviders: Provider[] = [
  {
    provide: 'GOOGLE_STRATEGY',
    inject: [ConfigService],
    useFactory: (config: ConfigService) =>
      config.get<string>('auth.google.clientId') ? new GoogleStrategy(config) : null,
  },
  {
    provide: 'FACEBOOK_STRATEGY',
    inject: [ConfigService],
    useFactory: (config: ConfigService) =>
      config.get<string>('auth.facebook.appId') ? new FacebookStrategy(config) : null,
  },
];

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('auth.accessSecret'),
        signOptions: { expiresIn: config.get<string>('auth.accessTtl') ?? '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ...oauthProviders],
  exports: [AuthService],
})
export class AuthModule {}
