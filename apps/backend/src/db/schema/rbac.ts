import { relations } from 'drizzle-orm';
import { boolean, index, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { createId, timestamps } from './_shared';
import { users } from './identity';

export const staffUsers = pgTable('staff_users', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  employeeNo: text('employee_no'),
  department: text('department'),
  isActive: boolean('is_active').notNull().default(true),
  createdById: text('created_by_id'),
  ...timestamps,
});

export const roles = pgTable('roles', {
  id: text('id').primaryKey().$defaultFn(createId),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamps.createdAt,
});

export const permissions = pgTable(
  'permissions',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    key: text('key').notNull().unique(),
    module: text('module').notNull(),
    action: text('action').notNull(),
    description: text('description'),
  },
  (table) => ({
    moduleIdx: index('permissions_module_idx').on(table.module),
  }),
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  }),
);

export const staffRoles = pgTable(
  'staff_roles',
  {
    staffUserId: text('staff_user_id')
      .notNull()
      .references(() => staffUsers.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.staffUserId, table.roleId] }),
  }),
);

/** Every admin mutation is recorded: who changed what, when, before/after. */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: text('actor_email'),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index('audit_logs_entity_idx').on(table.entity, table.entityId),
    createdIdx: index('audit_logs_created_idx').on(table.createdAt),
  }),
);

export const staffUsersRelations = relations(staffUsers, ({ one, many }) => ({
  user: one(users, { fields: [staffUsers.userId], references: [users.id] }),
  roles: many(staffRoles),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  staff: many(staffRoles),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const staffRolesRelations = relations(staffRoles, ({ one }) => ({
  staffUser: one(staffUsers, { fields: [staffRoles.staffUserId], references: [staffUsers.id] }),
  role: one(roles, { fields: [staffRoles.roleId], references: [roles.id] }),
}));

export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
