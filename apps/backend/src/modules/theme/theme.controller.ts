import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { RequirePermissions, Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { type UpdateThemeDraftDto } from './dto/theme.dto';
import { type ThemeService } from './theme.service';

@ApiTags('theme')
@Controller('theme')
export class ThemeController {
  constructor(private readonly theme: ThemeService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Active design tokens for the storefront',
    description:
      'The frontend fetches this on boot and injects the tokens as CSS custom properties, so colours/fonts/radii change without a rebuild.',
  })
  getTheme() {
    return this.theme.getActiveTheme();
  }
}

@ApiTags('admin/theme')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
@Controller('admin/theme')
export class AdminThemeController {
  constructor(private readonly theme: ThemeService) {}

  @Get()
  @RequirePermissions('theme:read')
  @ApiOperation({ summary: 'All tokens grouped for the theme editor, including drafts' })
  getAdminTheme() {
    return this.theme.getAdminTheme();
  }

  @Post('draft')
  @RequirePermissions('theme:write')
  @ApiOperation({ summary: 'Save token edits as a draft (live site unchanged)' })
  saveDraft(
    @Body() dto: UpdateThemeDraftDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.theme.saveDraft(dto, this.context(user, req));
  }

  @Post('publish')
  @RequirePermissions('theme:publish')
  @ApiOperation({ summary: 'Publish / Go Live — promote every pending draft token' })
  publish(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.theme.publish(this.context(user, req));
  }

  @Post('discard')
  @RequirePermissions('theme:write')
  @ApiOperation({ summary: 'Discard all pending draft tokens' })
  discard(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.theme.discardDraft(this.context(user, req));
  }

  private context(user: AuthenticatedUser, req: Request) {
    return {
      actorId: user.sub,
      actorEmail: user.email,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    };
  }
}
