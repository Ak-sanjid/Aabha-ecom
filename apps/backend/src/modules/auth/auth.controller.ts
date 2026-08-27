import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { type AuthService } from './auth.service';
import type { AuthenticatedUser, AuthResult } from './auth.types';
import {
  type ForgotPasswordDto,
  type GuestCheckoutAccountDto,
  type IdentifyDto,
  type LoginDto,
  type RefreshTokenDto,
  type RegisterDto,
  type RequestOtpDto,
  type ResetPasswordDto,
  type VerifyOtpDto,
} from './dto/auth.dto';

const REFRESH_COOKIE = 'aabha_refresh';
const ACCESS_COOKIE = 'aabha_access';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ---- Unified login/register bar ----------------------------------------

  @Public()
  @Post('identify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Detect whether an email/phone belongs to an existing account',
    description:
      'Powers the single-input login bar: the response tells the UI whether to reveal a password field, an OTP field, or the full registration form.',
  })
  identify(@Body() dto: IdentifyDto) {
    return this.auth.identify(dto.identifier);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Password sign-in with email or mobile number' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto, this.meta(req));
    this.setCookies(res, result);
    return result;
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Create an account from the unified bar' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto, this.meta(req));
    this.setCookies(res, result);
    return result;
  }

  // ---- OTP ----------------------------------------------------------------

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a one-time code by SMS (provider is swappable)' })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a one-time code and sign in (creating the account if new)' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.verifyOtp(dto, this.meta(req));
    this.setCookies(res, result);
    return result;
  }

  // ---- Guest checkout -----------------------------------------------------

  @Public()
  @Post('guest')
  @ApiOperation({
    summary: 'Auto-create an account for a guest checkout',
    description: 'Default password is the mobile number; the UI shows a floating notice.',
  })
  async guest(
    @Body() dto: GuestCheckoutAccountDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.ensureGuestAccount(dto, this.meta(req));
    this.setCookies(res, result);
    return result;
  }

  // ---- Password reset -----------------------------------------------------

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a reset link over email or WhatsApp' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consume a reset token and set a new password' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  // ---- Sessions -----------------------------------------------------------

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new session' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto.refreshToken ?? (req.cookies?.[REFRESH_COOKIE] as string | undefined);
    const result = await this.auth.refresh(token ?? '', this.meta(req));
    this.setCookies(res, result);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the current session' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    return this.auth.logout(token, user.sub);
  }

  @Get('me')
  @ApiOperation({ summary: 'Current signed-in profile' })
  @ApiOkResponse({ description: 'The authenticated user without secrets' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.getProfile(user.sub);
  }

  // ---- OAuth --------------------------------------------------------------

  @Public()
  @Get('providers')
  @ApiOperation({ summary: 'Which social sign-in providers are configured' })
  providers() {
    return {
      google: Boolean(this.config.get<string>('auth.google.clientId')),
      facebook: Boolean(this.config.get<string>('auth.facebook.appId')),
    };
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Start Google OAuth' })
  googleStart(): void {
    /* Passport issues the redirect. */
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.completeOAuth(req, res);
  }

  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Start Facebook OAuth' })
  facebookStart(): void {
    /* Passport issues the redirect. */
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.completeOAuth(req, res);
  }

  // ---- Helpers ------------------------------------------------------------

  private async completeOAuth(req: Request, res: Response): Promise<void> {
    const profile = req.user as Parameters<AuthService['loginWithOAuth']>[0];
    const result = await this.auth.loginWithOAuth(profile, this.meta(req));
    this.setCookies(res, result);
    const webUrl = this.config.get<string>('app.publicWebUrl');
    const target = new URL('/auth/callback', webUrl);
    target.searchParams.set('status', 'ok');
    if (result.notice) target.searchParams.set('notice', result.notice.kind);
    res.redirect(target.toString());
  }

  private meta(req: Request): { ip?: string; userAgent?: string } {
    return {
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      userAgent: req.headers['user-agent'],
    };
  }

  private setCookies(res: Response, result: AuthResult): void {
    const isProduction = this.config.get<boolean>('app.isProduction');
    const base = {
      httpOnly: true,
      secure: Boolean(isProduction),
      sameSite: 'lax' as const,
      path: '/',
    };
    res.cookie(ACCESS_COOKIE, result.tokens.accessToken, {
      ...base,
      maxAge: result.tokens.expiresIn * 1000,
    });
    res.cookie(REFRESH_COOKIE, result.tokens.refreshToken, {
      ...base,
      maxAge: 30 * 24 * 3600 * 1000,
    });
  }
}
