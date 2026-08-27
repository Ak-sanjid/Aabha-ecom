import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { type CacheDriver } from 'src/cache/cache.driver';
import type { AuditContext } from 'src/common/utils';
import { DRIZZLE, type Database } from 'src/db/database.module';
import * as schema from 'src/db/schema';
import { type AuditService } from '../audit/audit.service';
import type { UpdateThemeDraftDto } from './dto/theme.dto';

const CACHE_KEY = 'theme:active:v1';
const CACHE_TTL = 60;

export interface PublicThemeToken {
  key: string;
  type: string;
  group: string;
  value: string;
  segmentValues?: Record<string, string> | null;
}

export interface PublicTheme {
  key: string;
  name: string;
  publishedAt: string | null;
  /** Flat token map, ready to be turned into CSS custom properties. */
  tokens: Record<string, string>;
  /** Per-audience overrides so men's/women's pages get distinct accents. */
  segments: Record<string, Record<string, string>>;
  raw: PublicThemeToken[];
}

/**
 * Serves and mutates the DB-backed design system.
 *
 * Draft/publish model (Milestone 6 "staging vs live" applied to theming):
 *   • admin edits write `draftValue`
 *   • `publish()` copies every `draftValue` into `value` in one transaction
 *   • the storefront only ever reads `value`
 */
@Injectable()
export class ThemeService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly cache: CacheDriver,
    private readonly audit: AuditService,
  ) {}

  async getActiveTheme(): Promise<PublicTheme> {
    const cached = await this.cache.get<PublicTheme>(CACHE_KEY);
    if (cached) return cached;

    const theme = await this.db.query.themes.findFirst({
      where: eq(schema.themes.isActive, true),
    });
    if (!theme) throw new NotFoundException('No active theme configured');

    const settings = await this.db
      .select()
      .from(schema.themeSettings)
      .where(
        and(eq(schema.themeSettings.themeId, theme.id), eq(schema.themeSettings.isPublic, true)),
      )
      .orderBy(asc(schema.themeSettings.position));

    const tokens: Record<string, string> = {};
    const segments: Record<string, Record<string, string>> = {};
    const raw: PublicThemeToken[] = [];

    for (const setting of settings) {
      tokens[setting.key] = setting.value;
      raw.push({
        key: setting.key,
        type: setting.type,
        group: setting.group,
        value: setting.value,
        segmentValues: setting.segmentValues ?? null,
      });
      if (setting.segmentValues) {
        for (const [segment, value] of Object.entries(setting.segmentValues)) {
          segments[segment] = { ...(segments[segment] ?? {}), [setting.key]: value };
        }
      }
    }

    const payload: PublicTheme = {
      key: theme.key,
      name: theme.name,
      publishedAt: theme.publishedAt?.toISOString() ?? null,
      tokens,
      segments,
      raw,
    };
    await this.cache.set(CACHE_KEY, payload, CACHE_TTL);
    return payload;
  }

  /** Admin view: includes non-public tokens and pending drafts. */
  async getAdminTheme() {
    const theme = await this.db.query.themes.findFirst({
      where: eq(schema.themes.isActive, true),
    });
    if (!theme) throw new NotFoundException('No active theme configured');

    const settings = await this.db
      .select()
      .from(schema.themeSettings)
      .where(eq(schema.themeSettings.themeId, theme.id))
      .orderBy(asc(schema.themeSettings.group), asc(schema.themeSettings.position));

    const groups = new Map<string, typeof settings>();
    for (const setting of settings) {
      groups.set(setting.group, [...(groups.get(setting.group) ?? []), setting]);
    }

    return {
      theme,
      pendingChanges: settings.filter((s) => s.draftValue !== null).length,
      groups: [...groups.entries()].map(([group, items]) => ({ group, items })),
    };
  }

  /** Saves admin edits as drafts — the live site is untouched until publish. */
  async saveDraft(dto: UpdateThemeDraftDto, context: AuditContext) {
    const theme = await this.db.query.themes.findFirst({
      where: eq(schema.themes.isActive, true),
    });
    if (!theme) throw new NotFoundException('No active theme configured');

    for (const token of dto.tokens) {
      const existing = await this.db.query.themeSettings.findFirst({
        where: and(
          eq(schema.themeSettings.themeId, theme.id),
          eq(schema.themeSettings.key, token.key),
        ),
      });
      if (!existing) continue;

      await this.db
        .update(schema.themeSettings)
        .set({
          draftValue: token.value,
          segmentValues: token.segmentValues ?? existing.segmentValues,
        })
        .where(eq(schema.themeSettings.id, existing.id));

      await this.audit.record({
        action: 'theme.draft.update',
        entity: 'ThemeSetting',
        entityId: existing.id,
        before: { value: existing.value, draftValue: existing.draftValue },
        after: { draftValue: token.value },
        context,
      });
    }

    return { saved: dto.tokens.length, published: false };
  }

  /** "Publish / Go Live": promotes every pending draft in one transaction. */
  async publish(context: AuditContext) {
    const theme = await this.db.query.themes.findFirst({
      where: eq(schema.themes.isActive, true),
    });
    if (!theme) throw new NotFoundException('No active theme configured');

    const pending = await this.db
      .select()
      .from(schema.themeSettings)
      .where(
        and(eq(schema.themeSettings.themeId, theme.id), isNotNull(schema.themeSettings.draftValue)),
      );

    await this.db.transaction(async (tx) => {
      for (const setting of pending) {
        await tx
          .update(schema.themeSettings)
          .set({ value: setting.draftValue as string, draftValue: null })
          .where(eq(schema.themeSettings.id, setting.id));
      }
      await tx
        .update(schema.themes)
        .set({ publishedAt: new Date() })
        .where(eq(schema.themes.id, theme.id));
    });

    await this.audit.record({
      action: 'theme.publish',
      entity: 'Theme',
      entityId: theme.id,
      after: { publishedTokens: pending.map((p) => p.key) },
      context,
    });

    await this.cache.del(CACHE_KEY);
    return { published: pending.length, keys: pending.map((p) => p.key) };
  }

  async discardDraft(context: AuditContext) {
    const theme = await this.db.query.themes.findFirst({
      where: eq(schema.themes.isActive, true),
    });
    if (!theme) throw new NotFoundException('No active theme configured');

    await this.db
      .update(schema.themeSettings)
      .set({ draftValue: null })
      .where(eq(schema.themeSettings.themeId, theme.id));

    await this.audit.record({
      action: 'theme.draft.discard',
      entity: 'Theme',
      entityId: theme.id,
      context,
    });
    return { discarded: true };
  }

  async invalidateCache(): Promise<void> {
    await this.cache.del(CACHE_KEY);
  }
}
