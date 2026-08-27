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
  courierProviderEnum,
  couponTypeEnum,
  orderChannelEnum,
  orderStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
  reviewSourceEnum,
} from './enums';
import { addresses, users } from './identity';

export const carts = pgTable(
  'carts',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    /** Anonymous cart key, mirrored into Redis for fast guest-cart reads. */
    guestToken: text('guest_token'),
    currency: text('currency').notNull().default('BDT'),
    couponCode: text('coupon_code'),
    note: text('note'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    guestUnique: uniqueIndex('carts_guest_token_unique').on(table.guestToken),
    userIdx: index('carts_user_idx').on(table.userId),
  }),
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    cartId: text('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    quantity: integer('quantity').notNull().default(1),
    unitPriceMinor: integer('unit_price_minor').notNull(),
    ...timestamps,
  },
  (table) => ({
    unique: uniqueIndex('cart_items_unique').on(table.cartId, table.productId, table.variantId),
  }),
);

export const wishlists = pgTable(
  'wishlists',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamps.createdAt,
  },
  (table) => ({
    unique: uniqueIndex('wishlists_unique').on(table.userId, table.productId),
  }),
);

export const coupons = pgTable('coupons', {
  id: text('id').primaryKey().$defaultFn(createId),
  code: text('code').notNull().unique(),
  type: couponTypeEnum('type').notNull().default('PERCENTAGE'),
  /** Basis points for PERCENTAGE, poisha for FIXED. */
  value: integer('value').notNull(),
  minSubtotalMinor: integer('min_subtotal_minor').notNull().default(0),
  maxDiscountMinor: integer('max_discount_minor'),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').notNull().default(0),
  perUserLimit: integer('per_user_limit'),
  appliesTo: jsonb('applies_to'),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    orderNumber: text('order_number').notNull().unique(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    addressId: text('address_id').references(() => addresses.id, { onDelete: 'set null' }),
    channel: orderChannelEnum('channel').notNull().default('WEBSITE'),
    status: orderStatusEnum('status').notNull().default('PLACED'),
    paymentMethod: paymentMethodEnum('payment_method').notNull().default('COD'),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('UNPAID'),
    couponId: text('coupon_id').references(() => coupons.id, { onDelete: 'set null' }),

    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone').notNull(),
    customerEmail: text('customer_email'),
    shippingSnapshot: jsonb('shipping_snapshot'),

    subtotalMinor: integer('subtotal_minor').notNull(),
    discountMinor: integer('discount_minor').notNull().default(0),
    shippingMinor: integer('shipping_minor').notNull().default(0),
    taxMinor: integer('tax_minor').notNull().default(0),
    totalMinor: integer('total_minor').notNull(),
    paidMinor: integer('paid_minor').notNull().default(0),
    currency: text('currency').notNull().default('BDT'),

    note: text('note'),
    internalNote: text('internal_note'),
    /** COD auto-verification (WhatsApp + IVR) outcome. */
    codVerifiedAt: timestamp('cod_verified_at', { withTimezone: true }),
    codVerificationAttempts: integer('cod_verification_attempts').notNull().default(0),
    cancelableUntil: timestamp('cancelable_until', { withTimezone: true }),
    placedAt: timestamp('placed_at', { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    returnedAt: timestamp('returned_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    userIdx: index('orders_user_idx').on(table.userId),
    statusIdx: index('orders_status_idx').on(table.status),
    placedIdx: index('orders_placed_at_idx').on(table.placedAt),
  }),
);

export const orderItems = pgTable(
  'order_items',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
    variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    titleSnapshot: text('title_snapshot').notNull(),
    skuSnapshot: text('sku_snapshot').notNull(),
    quantity: integer('quantity').notNull(),
    unitPriceMinor: integer('unit_price_minor').notNull(),
    discountMinor: integer('discount_minor').notNull().default(0),
    totalMinor: integer('total_minor').notNull(),
    /** Landed cost captured at order time for accurate historical profit. */
    unitCostMinor: integer('unit_cost_minor').notNull().default(0),
  },
  (table) => ({
    orderIdx: index('order_items_order_idx').on(table.orderId),
  }),
);

export const orderStatusEvents = pgTable(
  'order_status_events',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    from: orderStatusEnum('from_status'),
    to: orderStatusEnum('to_status').notNull(),
    reason: text('reason'),
    /** True when an admin forced the transition via manual override. */
    isOverride: boolean('is_override').notNull().default(false),
    actorId: text('actor_id'),
    actorLabel: text('actor_label'),
    meta: jsonb('meta'),
    createdAt: timestamps.createdAt,
  },
  (table) => ({
    orderIdx: index('order_status_events_order_idx').on(table.orderId, table.createdAt),
  }),
);

export const courierShipments = pgTable(
  'courier_shipments',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: courierProviderEnum('provider').notNull(),
    consignmentId: text('consignment_id'),
    trackingCode: text('tracking_code'),
    labelUrl: text('label_url'),
    status: text('status').notNull().default('CREATED'),
    providerStatus: text('provider_status'),
    codAmountMinor: integer('cod_amount_minor').notNull().default(0),
    chargeMinor: integer('charge_minor').notNull().default(0),
    /** Flagged when a parcel is marked returned but courier tracking stalls. */
    isStalled: boolean('is_stalled').notNull().default(false),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    payload: jsonb('payload'),
    ...timestamps,
  },
  (table) => ({
    orderIdx: index('courier_shipments_order_idx').on(table.orderId),
    providerIdx: index('courier_shipments_provider_idx').on(table.provider, table.status),
  }),
);

/** Admin "Connect" box: one API key per courier activates its adapter. */
export const courierAccounts = pgTable('courier_accounts', {
  id: text('id').primaryKey().$defaultFn(createId),
  provider: courierProviderEnum('provider').notNull().unique(),
  displayName: text('display_name').notNull(),
  /** Encrypted at rest by the application layer. */
  credentials: jsonb('credentials'),
  isActive: boolean('is_active').notNull().default(false),
  isSandbox: boolean('is_sandbox').notNull().default(true),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  ...timestamps,
});

export const reviews = pgTable(
  'reviews',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
    source: reviewSourceEnum('source').notNull().default('ONSITE'),
    authorName: text('author_name').notNull(),
    rating: integer('rating').notNull(),
    title: text('title'),
    body: text('body'),
    mediaUrls: text('media_urls').array().notNull().default([]),
    isApproved: boolean('is_approved').notNull().default(false),
    isVerified: boolean('is_verified').notNull().default(false),
    externalId: text('external_id'),
    externalUrl: text('external_url'),
    ...timestamps,
  },
  (table) => ({
    productIdx: index('reviews_product_idx').on(table.productId, table.isApproved),
    externalUnique: uniqueIndex('reviews_external_unique').on(table.externalId),
  }),
);

export const questions = pgTable(
  'questions',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    authorName: text('author_name'),
    body: text('body').notNull(),
    isApproved: boolean('is_approved').notNull().default(false),
    createdAt: timestamps.createdAt,
  },
  (table) => ({
    productIdx: index('questions_product_idx').on(table.productId, table.isApproved),
  }),
);

export const answers = pgTable(
  'answers',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    authorName: text('author_name'),
    body: text('body').notNull(),
    isStaff: boolean('is_staff').notNull().default(false),
    isApproved: boolean('is_approved').notNull().default(false),
    createdAt: timestamps.createdAt,
  },
  (table) => ({
    questionIdx: index('answers_question_idx').on(table.questionId),
  }),
);

/** Admin-curated FAQ, deliberately separate from customer Q&A. */
export const faqItems = pgTable(
  'faq_items',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }),
    scope: text('scope').notNull().default('PRODUCT'),
    questionEn: text('question_en').notNull(),
    questionBn: text('question_bn'),
    answerEn: text('answer_en').notNull(),
    answerBn: text('answer_bn'),
    position: integer('position').notNull().default(0),
    isVisible: boolean('is_visible').notNull().default(true),
    isAiDraft: boolean('is_ai_draft').notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    productIdx: index('faq_items_product_idx').on(table.productId, table.position),
  }),
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  address: one(addresses, { fields: [orders.addressId], references: [addresses.id] }),
  coupon: one(coupons, { fields: [orders.couponId], references: [coupons.id] }),
  items: many(orderItems),
  events: many(orderStatusEvents),
  shipments: many(courierShipments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const orderStatusEventsRelations = relations(orderStatusEvents, ({ one }) => ({
  order: one(orders, { fields: [orderStatusEvents.orderId], references: [orders.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  product: one(products, { fields: [questions.productId], references: [products.id] }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
}));

export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatusEvent = typeof orderStatusEvents.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Review = typeof reviews.$inferSelect;
