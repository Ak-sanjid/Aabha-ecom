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
import { audienceSegmentEnum, menuLocationEnum, themeTokenTypeEnum } from './enums';

/**
 * A named set of design tokens. Exactly one theme is active at a time.
 * Admin edits land in `draftValue` and are copied to `value` by "Publish".
 */
export const themes = pgTable('themes', {
  id: text('id').primaryKey().$defaultFn(createId),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  ...timestamps,
});

/**
 * One design token. The frontend fetches these on boot and injects them as CSS
 * custom properties, so colours/fonts/radii change with no rebuild or redeploy.
 */
export const themeSettings = pgTable(
  'theme_settings',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    themeId: text('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    type: themeTokenTypeEnum('type').notNull().default('COLOR'),
    group: text('group').notNull().default('core'),
    label: text('label').notNull(),
    description: text('description'),
    value: text('value').notNull(),
    /** Pending admin edit; copied into `value` on publish. */
    draftValue: text('draft_value'),
    /** Per-audience overrides, e.g. `{ "MEN": "#3F6C86" }`. */
    segmentValues: jsonb('segment_values').$type<Record<string, string>>(),
    position: integer('position').notNull().default(0),
    isPublic: boolean('is_public').notNull().default(true),
    updatedAt: timestamps.updatedAt,
  },
  (table) => ({
    themeKeyUnique: uniqueIndex('theme_settings_theme_key_unique').on(table.themeId, table.key),
    groupIdx: index('theme_settings_group_idx').on(table.group),
  }),
);

/**
 * Header rows, top category bar, side panel, mega-menu columns and footer are
 * all rows here — reorderable / hideable from the admin panel with no deploy.
 */
export const menuItems = pgTable(
  'menu_items',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    location: menuLocationEnum('location').notNull(),
    parentId: text('parent_id'),
    labelEn: text('label_en').notNull(),
    labelBn: text('label_bn').notNull(),
    href: text('href').notNull(),
    iconKey: text('icon_key'),
    badgeText: text('badge_text'),
    imageUrl: text('image_url'),
    /** Grouping letter for the A–Z brand mega-menu. */
    groupKey: text('group_key'),
    segment: audienceSegmentEnum('segment').notNull().default('UNISEX'),
    position: integer('position').notNull().default(0),
    isVisible: boolean('is_visible').notNull().default(true),
    openInNewTab: boolean('open_in_new_tab').notNull().default(false),
    draft: jsonb('draft'),
    ...timestamps,
  },
  (table) => ({
    locationIdx: index('menu_items_location_position_idx').on(table.location, table.position),
    parentIdx: index('menu_items_parent_idx').on(table.parentId),
  }),
);

/** Editable SEO meta per route. */
export const pageMeta = pgTable('page_meta', {
  id: text('id').primaryKey().$defaultFn(createId),
  path: text('path').notNull().unique(),
  titleEn: text('title_en').notNull(),
  titleBn: text('title_bn'),
  descriptionEn: text('description_en'),
  descriptionBn: text('description_bn'),
  canonicalUrl: text('canonical_url'),
  ogImageUrl: text('og_image_url'),
  noIndex: boolean('no_index').notNull().default(false),
  jsonLd: jsonb('json_ld'),
  updatedAt: timestamps.updatedAt,
});

/** Integration keys and feature flags, editable from the admin panel. */
export const appSettings = pgTable('app_settings', {
  id: text('id').primaryKey().$defaultFn(createId),
  key: text('key').notNull().unique(),
  group: text('group').notNull().default('general'),
  label: text('label').notNull(),
  value: jsonb('value').notNull(),
  draft: jsonb('draft'),
  isSecret: boolean('is_secret').notNull().default(false),
  updatedAt: timestamps.updatedAt,
});

export const themesRelations = relations(themes, ({ many }) => ({
  settings: many(themeSettings),
}));

export const themeSettingsRelations = relations(themeSettings, ({ one }) => ({
  theme: one(themes, { fields: [themeSettings.themeId], references: [themes.id] }),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  parent: one(menuItems, {
    fields: [menuItems.parentId],
    references: [menuItems.id],
    relationName: 'menu_tree',
  }),
  children: many(menuItems, { relationName: 'menu_tree' }),
}));

export type Theme = typeof themes.$inferSelect;
export type ThemeSetting = typeof themeSettings.$inferSelect;
export type NewThemeSetting = typeof themeSettings.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
