import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { RequirePermissions, Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  type CreateMenuItemDto,
  type ReorderMenuDto,
  type UpdateMenuItemDto,
} from '../theme/dto/theme.dto';
import { type NavigationService } from './navigation.service';

@ApiTags('navigation')
@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigation: NavigationService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Header, top category bar, side panel and mega-menus',
    description: 'Everything is admin-editable at runtime; the frontend renders whatever it gets.',
  })
  getNavigation() {
    return this.navigation.getNavigation();
  }
}

@ApiTags('admin/navigation')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
@Controller('admin/navigation')
export class AdminNavigationController {
  constructor(private readonly navigation: NavigationService) {}

  @Get()
  @RequirePermissions('theme:read')
  @ApiOperation({ summary: 'Flat list of every menu item, including hidden ones' })
  list() {
    return this.navigation.listForAdmin();
  }

  @Post()
  @RequirePermissions('theme:write')
  @ApiOperation({ summary: 'Add a navigation item (no deploy needed)' })
  create(
    @Body() dto: CreateMenuItemDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.navigation.create(dto, this.context(user, req));
  }

  @Patch(':id')
  @RequirePermissions('theme:write')
  @ApiOperation({ summary: 'Edit a navigation item' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.navigation.update(id, dto, this.context(user, req));
  }

  @Post(':id/toggle')
  @RequirePermissions('theme:write')
  @ApiOperation({ summary: 'Show/hide a navigation item' })
  toggle(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.navigation.toggleVisibility(id, this.context(user, req));
  }

  @Post('reorder')
  @RequirePermissions('theme:write')
  @ApiOperation({ summary: 'Persist a new ordering' })
  reorder(
    @Body() dto: ReorderMenuDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.navigation.reorder(dto, this.context(user, req));
  }

  @Delete(':id')
  @RequirePermissions('theme:write')
  @ApiOperation({ summary: 'Delete a navigation item' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.navigation.remove(id, this.context(user, req));
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
