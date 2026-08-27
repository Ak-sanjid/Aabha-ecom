import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, ROLES_KEY, type AppRole } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/modules/auth/auth.types';

/**
 * Enforces the RBAC model: the primary admin creates staff accounts scoped to
 * specific modules, and every admin route declares what it needs.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length && !requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Authentication required');

    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Your role does not have access to this area');
    }

    if (requiredPermissions?.length) {
      const held = user.permissions ?? [];
      const allowed = held.includes('*') || requiredPermissions.every((p) => held.includes(p));
      if (!allowed) {
        throw new ForbiddenException(`Missing permission: ${requiredPermissions.join(', ')}`);
      }
    }
    return true;
  }
}
