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
import { products, productVariants } from './catalog';
import {
  audiencePlatformEnum,
  marketingEventNameEnum,
  paymentMethodEnum,
  syncStatusEnum,
} from './enums';
import { users } from './identity';
import { warehouses } from './inventory';

/**
 * Single source of truth for the analytics pipeline. Each row carries a unique
 * `eventId` so the browser Pixel and the server-side Conversions API call can
 * be deduplicated by Meta, and mirrors delivery flags per destination.
 */
export const marketingEvents = pgTable(
  'marketing_events',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    eventId: text('event_id').notNull().unique(),
    name: marketingEventNameEnum('name').notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    anonymousId: text('anonymous_id'),
    orderId: text('order_id'),
    productId: text('product_id'),
    valueMinor: integer('value_minor'),
    currency: text('currency').notNull().default('BDT'),
    sourceUrl: text('source_url'),
    userAgent: text('user_agent'),
    ip: text('ip'),
    fbclid: text('fbclid'),
    gclid: text('gclid'),
    payload: jsonb('payload'),
    sentToMeta: boolean('sent_to_meta').notNull().default(false),
    sentToGa4: boolean('sent_to_ga4').notNull().default(false),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index('marketing_events_name_idx').on(table.name, table.occurredAt),
    anonIdx: index('marketing_events_anon_idx').on(table.anonymousId),
  }),
);

export const retargetingAudienceSyncs = pgTable(
  'retargeting_audience_syncs',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    platform: audiencePlatformEnum('platform').notNull(),
    audienceKey: text('audience_key').notNull(),
    audienceName: text('audience_name').notNull(),
    status: syncStatusEnum('status').notNull().default('PENDING'),
    memberCount: integer('member_count').notNull().default(0),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    error: text('error'),
    payload: jsonb('payload'),
    ...timestamps,
  },
  (table) => ({
    unique: uniqueIndex('retargeting_audience_unique').on(table.platform, table.audienceKey),
  }),
);

export const posTransactions = pgTable(
  'pos_transactions',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    receiptNumber: text('receipt_number').notNull().unique(),
    warehouseId: text('warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    cashierId: text('cashier_id'),
    customerId: text('customer_id').references(() => users.id, { onDelete: 'set null' }),
    subtotalMinor: integer('subtotal_minor').notNull(),
    discountMinor: integer('discount_minor').notNull().default(0),
    taxMinor: integer('tax_minor').notNull().default(0),
    totalMinor: integer('total_minor').notNull(),
    paidMinor: integer('paid_minor').notNull(),
    changeMinor: integer('change_minor').notNull().default(0),
    paymentMethod: paymentMethodEnum('payment_method').notNull().default('POS_CASH'),
    createdAt: timestamps.createdAt,
  },
  (table) => ({
    createdIdx: index('pos_transactions_created_idx').on(table.createdAt),
  }),
);

export const posTransactionItems = pgTable(
  'pos_transaction_items',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    transactionId: text('transaction_id')
      .notNull()
      .references(() => posTransactions.id, { onDelete: 'cascade' }),
    productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
    variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    titleSnapshot: text('title_snapshot').notNull(),
    quantity: integer('quantity').notNull(),
    unitPriceMinor: integer('unit_price_minor').notNull(),
    totalMinor: integer('total_minor').notNull(),
  },
  (table) => ({
    transactionIdx: index('pos_transaction_items_transaction_idx').on(table.transactionId),
  }),
);

export const posTransactionsRelations = relations(posTransactions, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [posTransactions.warehouseId],
    references: [warehouses.id],
  }),
  customer: one(users, { fields: [posTransactions.customerId], references: [users.id] }),
  items: many(posTransactionItems),
}));

export const posTransactionItemsRelations = relations(posTransactionItems, ({ one }) => ({
  transaction: one(posTransactions, {
    fields: [posTransactionItems.transactionId],
    references: [posTransactions.id],
  }),
}));

export type MarketingEvent = typeof marketingEvents.$inferSelect;
export type NewMarketingEvent = typeof marketingEvents.$inferInsert;
export type POSTransaction = typeof posTransactions.$inferSelect;
