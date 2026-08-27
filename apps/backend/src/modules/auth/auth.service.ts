import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm';
import { randomBytes, createHash } from 'node:crypto';
import { type CacheDriver } from 'src/cache/cache.driver';
import { classifyIdentifier, normalizePhone } from 'src/common/utils';
import { DRIZZLE, type Database } from 'src/db/database.module';
import * as schema from 'src/db/schema';
import { type NotificationService } from '../notifications/notification.service';
import type { AuthResult, AuthTokens, IdentifyResult, JwtPayload } from './auth.types';
import type {
  ForgotPasswordDto,
  GuestCheckoutAccountDto,
  LoginDto,
  RegisterDto,
  RequestOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';

interface OAuthProfileInput {
  provider: 'GOOGLE' | 'FACEBOOK';
  providerUserId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  raw?: unknown;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationService,
    private readonly cache: CacheDriver,
  ) {}

  // -------------------------------------------------------------------------
  // Step 1 of the unified login/register bar
  // -------------------------------------------------------------------------

  /**
   * The storefront shows ONE input. This endpoint tells the UI which fields to
   * reveal next: password (existing account), OTP (phone, no password), or the
   * full registration fields (new user).
   */
  async identify(rawIdentifier: string): Promise<IdentifyResult> {
    const { kind, value } = classifyIdentifier(rawIdentifier);

    if (kind === 'unknown') {
      return {
        identifierKind: 'unknown',
        normalized: value,
        exists: false,
        nextStep: 'INVALID',
        hasPassword: false,
        linkedProviders: [],
      };
    }

    const user = await this.findByIdentifier(kind, value);

    if (!user) {
      return {
        identifierKind: kind,
        normalized: value,
        exists: false,
        // A brand-new phone number goes straight to OTP; a new email registers.
        nextStep: kind === 'phone' ? 'OTP' : 'REGISTER',
        hasPassword: false,
        linkedProviders: [],
      };
    }

    const identities = await this.db
      .select({ provider: schema.authIdentities.provider })
      .from(schema.authIdentities)
      .where(eq(schema.authIdentities.userId, user.id));

    return {
      identifierKind: kind,
      normalized: value,
      exists: true,
      nextStep: user.passwordHash ? 'PASSWORD' : 'OTP',
      hasPassword: Boolean(user.passwordHash),
      linkedProviders: identities.map((i) => i.provider),
      maskedHint: this.maskIdentifier(kind, value),
    };
  }

  // -------------------------------------------------------------------------
  // Password auth
  // -------------------------------------------------------------------------

  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string }): Promise<AuthResult> {
    const { kind, value } = classifyIdentifier(dto.identifier);
    if (kind === 'unknown') throw new BadRequestException('Enter a valid email or mobile number');

    const throttleKey = `auth:login:${value}`;
    const attempts = await this.cache.incr(throttleKey, 900);
    if (attempts > 10) {
      throw new ForbiddenException('Too many attempts. Try again in 15 minutes.');
    }

    const user = await this.findByIdentifier(kind, value);
    if (!user?.passwordHash) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new ForbiddenException('This account has been disabled');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.cache.del(throttleKey);
    return this.issueSession(user, meta, { isNewAccount: false });
  }

  async register(dto: RegisterDto, meta: { ip?: string; userAgent?: string }): Promise<AuthResult> {
    const { kind, value } = classifyIdentifier(dto.identifier);
    if (kind === 'unknown') throw new BadRequestException('Enter a valid email or mobile number');

    const existing = await this.findByIdentifier(kind, value);
    if (existing) throw new BadRequestException('An account already exists for this identifier');

    const email = kind === 'email' ? value : (dto.email?.toLowerCase() ?? null);
    const phone = kind === 'phone' ? value : dto.phone ? normalizePhone(dto.phone) : null;

    const [user] = await this.db
      .insert(schema.users)
      .values({
        email,
        phone,
        fullName: dto.fullName,
        passwordHash: await this.hash(dto.password),
        locale: dto.locale ?? 'EN',
        marketingOptIn: dto.marketingOptIn ?? true,
        origin: 'SELF_REGISTERED',
      })
      .returning();

    if (!user) throw new BadRequestException('Could not create the account');
    return this.issueSession(user, meta, { isNewAccount: true });
  }

  // -------------------------------------------------------------------------
  // OTP (mobile) auth — provider-agnostic
  // -------------------------------------------------------------------------

  async requestOtp(
    dto: RequestOtpDto,
  ): Promise<{ sent: boolean; expiresInSeconds: number; devCode?: string }> {
    const phone = normalizePhone(dto.phone);
    if (!phone) throw new BadRequestException('Enter a valid Bangladeshi mobile number');

    const rateKey = `auth:otp:rate:${phone}`;
    const sends = await this.cache.incr(rateKey, 3600);
    if (sends > 5) throw new ForbiddenException('OTP limit reached. Try again in an hour.');

    const length = this.config.get<number>('otp.length') ?? 6;
    const ttl = this.config.get<number>('otp.ttlSeconds') ?? 300;
    const code = this.generateNumericCode(length);

    const user = await this.db.query.users.findFirst({ where: eq(schema.users.phone, phone) });

    await this.db.insert(schema.otpCodes).values({
      userId: user?.id ?? null,
      destination: phone,
      channel: 'SMS',
      purpose: dto.purpose ?? 'LOGIN',
      codeHash: await this.hash(code),
      expiresAt: new Date(Date.now() + ttl * 1000),
    });

    await this.notifications.sendOtp(phone, code, user?.locale ?? 'EN');

    // In development the code is returned so the flow is testable end-to-end
    // without a live SMS gateway. Never leaked in production.
    const isProduction = this.config.get<boolean>('app.isProduction');
    return {
      sent: true,
      expiresInSeconds: ttl,
      ...(isProduction ? {} : { devCode: code }),
    };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
    meta: { ip?: string; userAgent?: string },
  ): Promise<AuthResult> {
    const phone = normalizePhone(dto.phone);
    if (!phone) throw new BadRequestException('Enter a valid Bangladeshi mobile number');

    const record = await this.db.query.otpCodes.findFirst({
      where: and(
        eq(schema.otpCodes.destination, phone),
        isNull(schema.otpCodes.consumedAt),
        gt(schema.otpCodes.expiresAt, new Date()),
      ),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    if (!record) throw new UnauthorizedException('This code has expired. Request a new one.');

    const maxAttempts = this.config.get<number>('otp.maxAttempts') ?? 5;
    if (record.attempts >= maxAttempts) {
      throw new ForbiddenException('Too many incorrect attempts. Request a new code.');
    }

    const valid = await bcrypt.compare(dto.code, record.codeHash);
    if (!valid) {
      await this.db
        .update(schema.otpCodes)
        .set({ attempts: record.attempts + 1 })
        .where(eq(schema.otpCodes.id, record.id));
      throw new UnauthorizedException('Incorrect code');
    }

    await this.db
      .update(schema.otpCodes)
      .set({ consumedAt: new Date() })
      .where(eq(schema.otpCodes.id, record.id));

    let user = await this.db.query.users.findFirst({ where: eq(schema.users.phone, phone) });
    let isNewAccount = false;

    if (!user) {
      const [created] = await this.db
        .insert(schema.users)
        .values({
          phone,
          fullName: dto.fullName ?? null,
          origin: 'SELF_REGISTERED',
          phoneVerifiedAt: new Date(),
        })
        .returning();
      user = created;
      isNewAccount = true;
      if (user) {
        await this.db.insert(schema.authIdentities).values({
          userId: user.id,
          provider: 'OTP',
          providerUserId: phone,
        });
      }
    } else if (!user.phoneVerifiedAt) {
      await this.db
        .update(schema.users)
        .set({ phoneVerifiedAt: new Date() })
        .where(eq(schema.users.id, user.id));
    }

    if (!user) throw new BadRequestException('Could not complete OTP sign-in');
    return this.issueSession(user, meta, { isNewAccount });
  }

  // -------------------------------------------------------------------------
  // OAuth — account linking by verified email
  // -------------------------------------------------------------------------

  async loginWithOAuth(
    profile: OAuthProfileInput,
    meta: { ip?: string; userAgent?: string },
  ): Promise<AuthResult> {
    const email = profile.email?.toLowerCase() ?? null;

    const identity = await this.db.query.authIdentities.findFirst({
      where: and(
        eq(schema.authIdentities.provider, profile.provider),
        eq(schema.authIdentities.providerUserId, profile.providerUserId),
      ),
    });

    if (identity) {
      const user = await this.db.query.users.findFirst({
        where: eq(schema.users.id, identity.userId),
      });
      if (!user) throw new NotFoundException('Linked account no longer exists');
      return this.issueSession(user, meta, { isNewAccount: false });
    }

    // Link to an existing account when the social email matches.
    let user = email
      ? await this.db.query.users.findFirst({ where: eq(schema.users.email, email) })
      : undefined;
    let linked = Boolean(user);
    let isNewAccount = false;

    if (!user) {
      const [created] = await this.db
        .insert(schema.users)
        .values({
          email,
          fullName: profile.displayName ?? null,
          origin: 'SOCIAL',
          emailVerifiedAt: email ? new Date() : null,
        })
        .returning();
      user = created;
      isNewAccount = true;
      linked = false;
    }

    if (!user) throw new BadRequestException('Could not complete social sign-in');

    await this.db.insert(schema.authIdentities).values({
      userId: user.id,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      email,
      displayName: profile.displayName ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      raw: (profile.raw as object) ?? null,
    });

    const result = await this.issueSession(user, meta, { isNewAccount });
    if (linked) {
      result.notice = {
        kind: 'ACCOUNT_LINKED',
        messageEn: `We linked your ${profile.provider.toLowerCase()} sign-in to your existing Aabha account.`,
        messageBn: `আপনার ${profile.provider.toLowerCase()} সাইন-ইন বিদ্যমান আভা অ্যাকাউন্টের সাথে যুক্ত করা হয়েছে।`,
      };
    }
    return result;
  }

  // -------------------------------------------------------------------------
  // Guest checkout → auto-created account
  // -------------------------------------------------------------------------

  /**
   * Creates (or reuses) an account for a guest checkout. The default password
   * is the customer's phone number — the storefront surfaces this via a
   * floating auto-dismissing notification built from `notice`.
   */
  async ensureGuestAccount(
    dto: GuestCheckoutAccountDto,
    meta: { ip?: string; userAgent?: string },
  ): Promise<AuthResult> {
    const phone = normalizePhone(dto.phone);
    if (!phone) throw new BadRequestException('Enter a valid Bangladeshi mobile number');

    const existing = await this.db.query.users.findFirst({ where: eq(schema.users.phone, phone) });
    if (existing) {
      return this.issueSession(existing, meta, { isNewAccount: false });
    }

    const [user] = await this.db
      .insert(schema.users)
      .values({
        phone,
        email: dto.email?.toLowerCase() ?? null,
        fullName: dto.fullName,
        // Default password = phone number, flagged for a forced change.
        passwordHash: await this.hash(phone),
        mustChangePassword: true,
        origin: 'GUEST_CHECKOUT',
        locale: dto.locale ?? 'EN',
      })
      .returning();

    if (!user) throw new BadRequestException('Could not create the guest account');

    await this.notifications.sendWelcomeGuestAccount(phone, user.locale);

    const result = await this.issueSession(user, meta, { isNewAccount: true });
    result.notice = {
      kind: 'GUEST_ACCOUNT_CREATED',
      messageEn: `We created an account for you. Username: ${phone}, password: your mobile number.`,
      messageBn: `আপনার জন্য একটি অ্যাকাউন্ট তৈরি হয়েছে। ইউজারনেম: ${phone}, পাসওয়ার্ড: আপনার মোবাইল নম্বর।`,
    };
    return result;
  }

  // -------------------------------------------------------------------------
  // Password reset (email / WhatsApp)
  // -------------------------------------------------------------------------

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ sent: boolean }> {
    const { kind, value } = classifyIdentifier(dto.identifier);
    if (kind === 'unknown') throw new BadRequestException('Enter a valid email or mobile number');

    const user = await this.findByIdentifier(kind, value);
    // Always answer "sent" so the endpoint cannot enumerate accounts.
    if (!user) return { sent: true };

    const token = randomBytes(32).toString('hex');
    const channel = dto.channel ?? (user.email ? 'EMAIL' : 'WHATSAPP');

    await this.db.insert(schema.passwordResetTokens).values({
      userId: user.id,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      channel,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const webUrl = this.config.get<string>('app.publicWebUrl');
    const link = `${webUrl}/reset-password?token=${token}`;
    const destination = channel === 'EMAIL' ? user.email : user.phone;
    if (destination) {
      await this.notifications.sendPasswordResetLink(destination, link, channel);
    }
    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ ok: true }> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const record = await this.db.query.passwordResetTokens.findFirst({
      where: and(
        eq(schema.passwordResetTokens.tokenHash, tokenHash),
        isNull(schema.passwordResetTokens.consumedAt),
        gt(schema.passwordResetTokens.expiresAt, new Date()),
      ),
    });
    if (!record) throw new BadRequestException('This reset link is invalid or has expired');

    await this.db
      .update(schema.users)
      .set({ passwordHash: await this.hash(dto.password), mustChangePassword: false })
      .where(eq(schema.users.id, record.userId));

    await this.db
      .update(schema.passwordResetTokens)
      .set({ consumedAt: new Date() })
      .where(eq(schema.passwordResetTokens.id, record.id));

    // Every existing session is invalidated after a password change.
    await this.db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshTokens.userId, record.userId));

    return { ok: true };
  }

  // -------------------------------------------------------------------------
  // Sessions
  // -------------------------------------------------------------------------

  async refresh(rawToken: string, meta: { ip?: string; userAgent?: string }): Promise<AuthResult> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const record = await this.db.query.refreshTokens.findFirst({
      where: and(
        eq(schema.refreshTokens.tokenHash, tokenHash),
        isNull(schema.refreshTokens.revokedAt),
        gt(schema.refreshTokens.expiresAt, new Date()),
      ),
    });
    if (!record) throw new UnauthorizedException('Session expired, please sign in again');

    await this.db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshTokens.id, record.id));

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, record.userId),
    });
    if (!user) throw new UnauthorizedException('Account no longer exists');

    return this.issueSession(user, meta, { isNewAccount: false });
  }

  async logout(rawToken: string | undefined, userId: string): Promise<{ ok: true }> {
    if (rawToken) {
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      await this.db
        .update(schema.refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(schema.refreshTokens.tokenHash, tokenHash));
    } else {
      await this.db
        .update(schema.refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(schema.refreshTokens.userId, userId));
    }
    return { ok: true };
  }

  async getProfile(userId: string) {
    const user = await this.db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async findByIdentifier(kind: 'email' | 'phone', value: string) {
    return this.db.query.users.findFirst({
      where:
        kind === 'email'
          ? eq(schema.users.email, value)
          : or(eq(schema.users.phone, value), eq(schema.users.email, value)),
    });
  }

  private async hash(value: string): Promise<string> {
    const rounds = this.config.get<number>('auth.bcryptRounds') ?? 10;
    return bcrypt.hash(value, rounds);
  }

  private generateNumericCode(length: number): string {
    const max = 10 ** length;
    const value = randomBytes(4).readUInt32BE(0) % max;
    return value.toString().padStart(length, '0');
  }

  private maskIdentifier(kind: 'email' | 'phone', value: string): string {
    if (kind === 'phone') return `${value.slice(0, 3)}****${value.slice(-3)}`;
    const [name = '', domain = ''] = value.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }

  private async resolvePermissions(userId: string, role: string): Promise<string[]> {
    if (role === 'SUPER_ADMIN') return ['*'];
    const rows = await this.db
      .select({ key: schema.permissions.key })
      .from(schema.staffUsers)
      .innerJoin(schema.staffRoles, eq(schema.staffRoles.staffUserId, schema.staffUsers.id))
      .innerJoin(
        schema.rolePermissions,
        eq(schema.rolePermissions.roleId, schema.staffRoles.roleId),
      )
      .innerJoin(schema.permissions, eq(schema.permissions.id, schema.rolePermissions.permissionId))
      .where(eq(schema.staffUsers.userId, userId));
    return [...new Set(rows.map((r) => r.key))];
  }

  private async issueSession(
    user: typeof schema.users.$inferSelect,
    meta: { ip?: string; userAgent?: string },
    options: { isNewAccount: boolean },
  ): Promise<AuthResult> {
    const permissions = await this.resolvePermissions(user.id, user.role);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions,
    };

    const accessTtl = this.config.get<string>('auth.accessTtl') ?? '15m';
    const refreshTtl = this.config.get<string>('auth.refreshTtl') ?? '30d';

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('auth.accessSecret'),
      expiresIn: accessTtl,
    });

    const refreshToken = randomBytes(48).toString('hex');
    await this.db.insert(schema.refreshTokens).values({
      userId: user.id,
      tokenHash: createHash('sha256').update(refreshToken).digest('hex'),
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
      expiresAt: new Date(Date.now() + this.ttlToMs(refreshTtl)),
    });

    await this.db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(this.ttlToMs(accessTtl) / 1000),
    };

    const result: AuthResult = {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        locale: user.locale,
        mustChangePassword: user.mustChangePassword,
        isNewAccount: options.isNewAccount,
      },
      tokens,
    };

    if (user.mustChangePassword) {
      result.notice = {
        kind: 'PASSWORD_CHANGE_REQUIRED',
        messageEn: 'For your security, please set a new password in Account settings.',
        messageBn: 'নিরাপত্তার জন্য অ্যাকাউন্ট সেটিংসে গিয়ে নতুন পাসওয়ার্ড দিন।',
      };
    }
    return result;
  }

  private ttlToMs(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 15 * 60 * 1000;
    const amount = Number(match[1]);
    const unit = match[2];
    const factor =
      unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
    return amount * factor;
  }

  /** Health helper for the /health endpoint. */
  async countUsers(): Promise<number> {
    const [row] = await this.db.select({ count: sql<number>`count(*)::int` }).from(schema.users);
    return row?.count ?? 0;
  }
}
