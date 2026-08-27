import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createId, timestamps } from './_shared';
import {
  accountOriginEnum,
  addressTypeEnum,
  authProviderEnum,
  localeEnum,
  otpChannelEnum,
  otpPurposeEnum,
  userRoleEnum,
} from './enums';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    email: text('email'),
    phone: text('phone'),
    fullName: text('full_name'),
    passwordHash: text('password_hash'),
    role: userRoleEnum('role').notNull().default('CUSTOMER'),
    origin: accountOriginEnum('origin').notNull().default('SELF_REGISTERED'),
    locale: localeEnum('locale').notNull().default('EN'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
    /** True for guest-checkout accounts whose password defaults to the phone number. */
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    /** Delivery success vs return/cancel score (0-100), recomputed by a job. */
    riskScore: integer('risk_score'),
    marketingOptIn: boolean('marketing_opt_in').notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    emailUnique: uniqueIndex('users_email_unique').on(table.email),
    phoneUnique: uniqueIndex('users_phone_unique').on(table.phone),
    roleIdx: index('users_role_idx').on(table.role),
    createdIdx: index('users_created_at_idx').on(table.createdAt),
  }),
);

/** One row per linked social/OTP identity. Accounts link by verified email. */
export const authIdentities = pgTable(
  'auth_identities',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: authProviderEnum('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    email: text('email'),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    raw: jsonb('raw'),
    createdAt: timestamps.createdAt,
  },
  (table) => ({
    providerUnique: uniqueIndex('auth_identities_provider_unique').on(
      table.provider,
      table.providerUserId,
    ),
    userIdx: index('auth_identities_user_idx').on(table.userId),
  }),
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    userAgent: text('user_agent'),
    ip: text('ip'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamps.createdAt,
  },
  (table) => ({
    tokenUnique: uniqueIndex('refresh_tokens_hash_unique').on(table.tokenHash),
    userIdx: index('refresh_tokens_user_idx').on(table.userId),
  }),
);

export const otpCodes = pgTable(
  'otp_codes',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    destination: text('destination').notNull(),
    channel: otpChannelEnum('channel').notNull().default('SMS'),
    purpose: otpPurposeEnum('purpose').notNull().default('LOGIN'),
    codeHash: text('code_hash').notNull(),
    attempts: integer('attempts').notNull().default(0),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => ({
    destinationIdx: index('otp_codes_destination_idx').on(table.destination, table.purpose),
  }),
);

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    channel: otpChannelEnum('channel').notNull().default('EMAIL'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamps.createdAt,
  },
  (table) => ({
    tokenUnique: uniqueIndex('password_reset_tokens_hash_unique').on(table.tokenHash),
    userIdx: index('password_reset_tokens_user_idx').on(table.userId),
  }),
);

export const addresses = pgTable(
  'addresses',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: addressTypeEnum('type').notNull().default('SHIPPING'),
    label: text('label'),
    recipient: text('recipient').notNull(),
    phone: text('phone').notNull(),
    line1: text('line1').notNull(),
    line2: text('line2'),
    area: text('area'),
    city: text('city').notNull(),
    district: text('district'),
    division: text('division'),
    postcode: text('postcode'),
    country: text('country').notNull().default('BD'),
    isDefault: boolean('is_default').notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    userIdx: index('addresses_user_idx').on(table.userId),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  identities: many(authIdentities),
  refreshTokens: many(refreshTokens),
  otpCodes: many(otpCodes),
}));

export const authIdentitiesRelations = relations(authIdentities, ({ one }) => ({
  user: one(users, { fields: [authIdentities.userId], references: [users.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Address = typeof addresses.$inferSelect;
export type AuthIdentity = typeof authIdentities.$inferSelect;
