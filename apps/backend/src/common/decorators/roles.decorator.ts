import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

export type AppRole = 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';

/** Restricts a route to the listed roles. */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Restricts a route to holders of specific RBAC permission keys
 * (e.g. `theme:publish`, `orders:override`).
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
