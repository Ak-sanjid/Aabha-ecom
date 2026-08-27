import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createId, timestamps } from './_shared';
import {
  audienceSegmentEnum,
  categorySystemEnum,
  mediaTypeEnum,
  productStatusEnum,
  publishStateEnum,
} from './enums';

export const categories = pgTable(
  'categories',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    /** Which of the two parallel category systems this node belongs to. */
    system: categorySystemEnum('system').notNull().default('TOP_BAR'),
    parentId: text('parent_id'),
    slug: text('slug').notNull(),
    nameEn: text('name_en').notNull(),
    nameBn: text('name_bn').notNull(),
    descriptionEn: text('description_en'),
    descriptionBn: text('description_bn'),
    iconKey: text('icon_key'),
    imageUrl: text('image_url'),
    bannerUrl: text('banner_url'),
    segment: audienceSegmentEnum('segment').notNull().default('UNISEX'),
    position: integer('position').notNull().default(0),
    isVisible: boolean('is_visible').notNull().default(true),
    metaTitleEn: text('meta_title_en'),
    metaTitleBn: text('meta_title_bn'),
    metaDescriptionEn: text('meta_description_en'),
    metaDescriptionBn: text('meta_description_bn'),
    ...timestamps,
  },
  (table) => ({
    systemSlugUnique: uniqueIndex('categories_system_slug_unique').on(table.system, table.slug),
    parentIdx: index('categories_parent_idx').on(table.parentId),
  }),
);

export const brands = pgTable('brands', {
  id: text('id').primaryKey().$defaultFn(createId),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  nameBn: text('name_bn'),
  descriptionEn: text('description_en'),
  descriptionBn: text('description_bn'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  websiteUrl: text('website_url'),
  /** Per-brand token overrides so a brand page can echo the brand's own site. */
  themeOverride: jsonb('theme_override').$type<Record<string, string>>(),
  countryOfOrigin: text('country_of_origin'),
  isFeatured: boolean('is_featured').notNull().default(false),
  isVisible: boolean('is_visible').notNull().default(true),
  position: integer('position').notNull().default(0),
  ...timestamps,
});

export const products = pgTable(
  'products',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    slug: text('slug').notNull().unique(),
    sku: text('sku').notNull().unique(),
    brandId: text('brand_id').references(() => brands.id, { onDelete: 'set null' }),
    status: productStatusEnum('status').notNull().default('DRAFT'),
    publishState: publishStateEnum('publish_state').notNull().default('DRAFT'),
    segment: audienceSegmentEnum('segment').notNull().default('UNISEX'),

    titleEn: text('title_en').notNull(),
    titleBn: text('title_bn').notNull(),
    shortDescriptionEn: text('short_description_en'),
    shortDescriptionBn: text('short_description_bn'),
    descriptionEn: text('description_en'),
    descriptionBn: text('description_bn'),
    usageEn: text('usage_en'),
    usageBn: text('usage_bn'),
    ingredientsEn: text('ingredients_en'),
    ingredientsBn: text('ingredients_bn'),

    /** Money in poisha (1 BDT = 100). Never floats. */
    priceMinor: integer('price_minor').notNull(),
    compareAtMinor: integer('compare_at_minor'),
    currency: text('currency').notNull().default('BDT'),

    skinTypes: text('skin_types').array().notNull().default([]),
    concerns: text('concerns').array().notNull().default([]),
    tags: text('tags').array().notNull().default([]),

    metaTitleEn: text('meta_title_en'),
    metaTitleBn: text('meta_title_bn'),
    metaDescriptionEn: text('meta_description_en'),
    metaDescriptionBn: text('meta_description_bn'),

    ratingAverage: doublePrecision('rating_average').notNull().default(0),
    ratingCount: integer('rating_count').notNull().default(0),
    soldCount: integer('sold_count').notNull().default(0),
    viewCount: integer('view_count').notNull().default(0),

    /** AI-generated copy awaiting admin approval — always editable, never locked. */
    aiDraft: jsonb('ai_draft'),
    draft: jsonb('draft'),
    ...timestamps,
  },
  (table) => ({
    statusIdx: index('products_status_idx').on(table.status, table.publishState),
    brandIdx: index('products_brand_idx').on(table.brandId),
    priceIdx: index('products_price_idx').on(table.priceMinor),
  }),
);

export const productCategories = pgTable(
  'product_categories',
  {
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.productId, table.categoryId] }),
    categoryIdx: index('product_categories_category_idx').on(table.categoryId),
  }),
);

export const productVariants = pgTable(
  'product_variants',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull().unique(),
    nameEn: text('name_en').notNull(),
    nameBn: text('name_bn'),
    optionShade: text('option_shade'),
    optionSize: text('option_size'),
    priceMinor: integer('price_minor').notNull(),
    compareAtMinor: integer('compare_at_minor'),
    barcode: text('barcode'),
    weightGrams: integer('weight_grams'),
    isDefault: boolean('is_default').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    position: integer('position').notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    productIdx: index('product_variants_product_idx').on(table.productId),
  }),
);

export const productMedia = pgTable(
  'product_media',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    type: mediaTypeEnum('type').notNull().default('IMAGE'),
    url: text('url').notNull(),
    blurDataUrl: text('blur_data_url'),
    altEn: text('alt_en'),
    altBn: text('alt_bn'),
    position: integer('position').notNull().default(0),
    isPrimary: boolean('is_primary').notNull().default(false),
    width: integer('width'),
    height: integer('height'),
    createdAt: timestamps.createdAt,
  },
  (table) => ({
    productIdx: index('product_media_product_idx').on(table.productId, table.position),
  }),
);

/** Learned upsell/cross-sell edges plus manually curated "related products". */
export const productRelations_ = pgTable(
  'product_relations',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    sourceId: text('source_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    targetId: text('target_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull().default('RELATED'),
    /** Co-occurrence weight learned from add-to-cart / purchase data. */
    score: doublePrecision('score').notNull().default(0),
    isManual: boolean('is_manual').notNull().default(false),
    updatedAt: timestamps.updatedAt,
  },
  (table) => ({
    edgeUnique: uniqueIndex('product_relations_edge_unique').on(
      table.sourceId,
      table.targetId,
      table.kind,
    ),
    targetIdx: index('product_relations_target_idx').on(table.targetId),
  }),
);

export const banners = pgTable(
  'banners',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    key: text('key').notNull().unique(),
    titleEn: text('title_en'),
    titleBn: text('title_bn'),
    subtitleEn: text('subtitle_en'),
    subtitleBn: text('subtitle_bn'),
    imageUrl: text('image_url').notNull(),
    mobileImageUrl: text('mobile_image_url'),
    href: text('href'),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
    brandId: text('brand_id').references(() => brands.id, { onDelete: 'set null' }),
    segment: audienceSegmentEnum('segment').notNull().default('UNISEX'),
    position: integer('position').notNull().default(0),
    isVisible: boolean('is_visible').notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    categoryIdx: index('banners_category_idx').on(table.categoryId),
    brandIdx: index('banners_brand_idx').on(table.brandId),
  }),
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'category_tree',
  }),
  children: many(categories, { relationName: 'category_tree' }),
  products: many(productCategories),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  categories: many(productCategories),
  variants: many(productVariants),
  media: many(productMedia),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, { fields: [productCategories.productId], references: [products.id] }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, { fields: [productMedia.productId], references: [products.id] }),
}));

export type Category = typeof categories.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type ProductMedia = typeof productMedia.$inferSelect;
export type Banner = typeof banners.$inferSelect;
