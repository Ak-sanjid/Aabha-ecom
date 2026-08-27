import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createId, timestamps } from './_shared';
import { products, productVariants } from './catalog';

export const warehouses = pgTable('warehouses', {
  id: text('id').primaryKey().$defaultFn(createId),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamps.createdAt,
});

export const stockLevels = pgTable(
  'stock_levels',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    warehouseId: text('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    lowStockAlert: integer('low_stock_alert').notNull().default(5),
    updatedAt: timestamps.updatedAt,
  },
  (table) => ({
    unique: uniqueIndex('stock_levels_unique').on(
      table.warehouseId,
      table.productId,
      table.variantId,
    ),
    productIdx: index('stock_levels_product_idx').on(table.productId),
  }),
);

export const stockTransfers = pgTable('stock_transfers', {
  id: text('id').primaryKey().$defaultFn(createId),
  reference: text('reference').notNull().unique(),
  fromWarehouseId: text('from_warehouse_id')
    .notNull()
    .references(() => warehouses.id),
  toWarehouseId: text('to_warehouse_id')
    .notNull()
    .references(() => warehouses.id),
  status: text('status').notNull().default('DRAFT'),
  note: text('note'),
  createdById: text('created_by_id'),
  createdAt: timestamps.createdAt,
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const stockTransferItems = pgTable(
  'stock_transfer_items',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    transferId: text('transfer_id')
      .notNull()
      .references(() => stockTransfers.id, { onDelete: 'cascade' }),
    variantId: text('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
  },
  (table) => ({
    transferIdx: index('stock_transfer_items_transfer_idx').on(table.transferId),
  }),
);

/**
 * Per-product landed-cost inputs feeding the auto profit calculation.
 * Every field is an integer in poisha; fee rates are basis points.
 */
export const costBreakdowns = pgTable('cost_breakdowns', {
  id: text('id').primaryKey().$defaultFn(createId),
  productId: text('product_id')
    .notNull()
    .unique()
    .references(() => products.id, { onDelete: 'cascade' }),
  importCostMinor: integer('import_cost_minor').notNull().default(0),
  purchaseCostMinor: integer('purchase_cost_minor').notNull().default(0),
  transportCostMinor: integer('transport_cost_minor').notNull().default(0),
  warehouseCostMinor: integer('warehouse_cost_minor').notNull().default(0),
  overheadCostMinor: integer('overhead_cost_minor').notNull().default(0),
  deliveryCostMinor: integer('delivery_cost_minor').notNull().default(0),
  packagingCostMinor: integer('packaging_cost_minor').notNull().default(0),
  marketingCostMinor: integer('marketing_cost_minor').notNull().default(0),
  /** Payment-gateway fee in basis points (200 = 2.00%). */
  gatewayFeeBps: integer('gateway_fee_bps').notNull().default(0),
  vatBps: integer('vat_bps').notNull().default(0),
  updatedById: text('updated_by_id'),
  updatedAt: timestamps.updatedAt,
});

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  warehouse: one(warehouses, { fields: [stockLevels.warehouseId], references: [warehouses.id] }),
  product: one(products, { fields: [stockLevels.productId], references: [products.id] }),
  variant: one(productVariants, {
    fields: [stockLevels.variantId],
    references: [productVariants.id],
  }),
}));

export const costBreakdownsRelations = relations(costBreakdowns, ({ one }) => ({
  product: one(products, { fields: [costBreakdowns.productId], references: [products.id] }),
}));

export type Warehouse = typeof warehouses.$inferSelect;
export type StockLevel = typeof stockLevels.$inferSelect;
export type CostBreakdown = typeof costBreakdowns.$inferSelect;
export type NewCostBreakdown = typeof costBreakdowns.$inferInsert;
