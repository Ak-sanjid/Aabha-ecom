import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import { type CacheDriver } from 'src/cache/cache.driver';
import type { AuditContext } from 'src/common/utils';
import { DRIZZLE, type Database } from 'src/db/database.module';
import * as schema from 'src/db/schema';
import { type AuditService } from '../audit/audit.service';
import type { CreateMenuItemDto, ReorderMenuDto, UpdateMenuItemDto } from '../theme/dto/theme.dto';

const CACHE_KEY = 'navigation:v1';
const CACHE_TTL = 60;

export interface NavNode {
  id: string;
  labelEn: string;
  labelBn: string;
  href: string;
  badgeText: string | null;
  iconKey: string | null;
  imageUrl: string | null;
  groupKey: string | null;
  segment: string;
  position: number;
  children: NavNode[];
}

export type NavigationTree = Record<string, NavNode[]>;

/**
 * Serves the whole admin-editable navigation: sticky two-line header, the top
 * category bar, the collapsible left category panel and both mega-menus.
 * Nothing here is hardcoded in the frontend.
 */
@Injectable()
export class NavigationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly cache: CacheDriver,
    private readonly audit: AuditService,
  ) {}

  async getNavigation(includeHidden = false): Promise<NavigationTree> {
    if (!includeHidden) {
      const cached = await this.cache.get<NavigationTree>(CACHE_KEY);
      if (cached) return cached;
    }

    const rows = await this.db
      .select()
      .from(schema.menuItems)
      .orderBy(asc(schema.menuItems.position), asc(schema.menuItems.createdAt));

    const visible = includeHidden ? rows : rows.filter((r) => r.isVisible);
    const byId = new Map<string, NavNode>();
    for (const row of visible) {
      byId.set(row.id, {
        id: row.id,
        labelEn: row.labelEn,
        labelBn: row.labelBn,
        href: row.href,
        badgeText: row.badgeText,
        iconKey: row.iconKey,
        imageUrl: row.imageUrl,
        groupKey: row.groupKey,
        segment: row.segment,
        position: row.position,
        children: [],
      });
    }

    const tree: NavigationTree = {};
    for (const row of visible) {
      const node = byId.get(row.id);
      if (!node) continue;
      if (row.parentId && byId.has(row.parentId)) {
        byId.get(row.parentId)?.children.push(node);
      } else {
        tree[row.location] = [...(tree[row.location] ?? []), node];
      }
    }

    if (!includeHidden) await this.cache.set(CACHE_KEY, tree, CACHE_TTL);
    return tree;
  }

  async listForAdmin() {
    const rows = await this.db
      .select()
      .from(schema.menuItems)
      .orderBy(asc(schema.menuItems.location), asc(schema.menuItems.position));
    return rows;
  }

  async create(dto: CreateMenuItemDto, context: AuditContext) {
    const [item] = await this.db
      .insert(schema.menuItems)
      .values({
        location: dto.location,
        parentId: dto.parentId ?? null,
        labelEn: dto.labelEn,
        labelBn: dto.labelBn,
        href: dto.href,
        badgeText: dto.badgeText ?? null,
        groupKey: dto.groupKey ?? null,
        segment: dto.segment ?? 'UNISEX',
        position: dto.position ?? 0,
        isVisible: dto.isVisible ?? true,
      })
      .returning();

    await this.audit.record({
      action: 'menu.create',
      entity: 'MenuItem',
      entityId: item?.id,
      after: item,
      context,
    });
    await this.cache.del(CACHE_KEY);
    return item;
  }

  async update(id: string, dto: UpdateMenuItemDto, context: AuditContext) {
    const before = await this.db.query.menuItems.findFirst({ where: eq(schema.menuItems.id, id) });
    if (!before) throw new NotFoundException('Menu item not found');

    const [after] = await this.db
      .update(schema.menuItems)
      .set({
        labelEn: dto.labelEn ?? before.labelEn,
        labelBn: dto.labelBn ?? before.labelBn,
        href: dto.href ?? before.href,
        badgeText: dto.badgeText ?? before.badgeText,
        position: dto.position ?? before.position,
        isVisible: dto.isVisible ?? before.isVisible,
      })
      .where(eq(schema.menuItems.id, id))
      .returning();

    await this.audit.record({
      action: 'menu.update',
      entity: 'MenuItem',
      entityId: id,
      before,
      after,
      context,
    });
    await this.cache.del(CACHE_KEY);
    return after;
  }

  async toggleVisibility(id: string, context: AuditContext) {
    const before = await this.db.query.menuItems.findFirst({ where: eq(schema.menuItems.id, id) });
    if (!before) throw new NotFoundException('Menu item not found');

    const [after] = await this.db
      .update(schema.menuItems)
      .set({ isVisible: !before.isVisible })
      .where(eq(schema.menuItems.id, id))
      .returning();

    await this.audit.record({
      action: 'menu.toggleVisibility',
      entity: 'MenuItem',
      entityId: id,
      before: { isVisible: before.isVisible },
      after: { isVisible: after?.isVisible },
      context,
    });
    await this.cache.del(CACHE_KEY);
    return after;
  }

  async reorder(dto: ReorderMenuDto, context: AuditContext) {
    const ids = dto.items.map((i) => i.id);
    const before = await this.db
      .select()
      .from(schema.menuItems)
      .where(inArray(schema.menuItems.id, ids));

    await this.db.transaction(async (tx) => {
      for (const entry of dto.items) {
        await tx
          .update(schema.menuItems)
          .set({ position: entry.position })
          .where(eq(schema.menuItems.id, entry.id));
      }
    });

    await this.audit.record({
      action: 'menu.reorder',
      entity: 'MenuItem',
      before: before.map((b) => ({ id: b.id, position: b.position })),
      after: dto.items,
      context,
    });
    await this.cache.del(CACHE_KEY);
    return { reordered: dto.items.length };
  }

  async remove(id: string, context: AuditContext) {
    const before = await this.db.query.menuItems.findFirst({ where: eq(schema.menuItems.id, id) });
    if (!before) throw new NotFoundException('Menu item not found');

    await this.db.delete(schema.menuItems).where(eq(schema.menuItems.id, id));
    await this.audit.record({
      action: 'menu.delete',
      entity: 'MenuItem',
      entityId: id,
      before,
      context,
    });
    await this.cache.del(CACHE_KEY);
    return { deleted: true };
  }
}
