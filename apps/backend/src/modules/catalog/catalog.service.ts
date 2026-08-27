import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { DRIZZLE, type Database } from 'src/db/database.module';
import * as schema from 'src/db/schema';

/**
 * Read-side catalog service. Milestone 2 extends this with the full filter
 * matrix (price range, sub-categories, brand multi-select, skin type); the
 * pagination + filter contract is already in place here.
 */
@Injectable()
export class CatalogService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async listCategories(system?: 'SIDE_PANEL' | 'TOP_BAR') {
    const rows = await this.db
      .select()
      .from(schema.categories)
      .where(
        system
          ? and(eq(schema.categories.system, system), eq(schema.categories.isVisible, true))
          : eq(schema.categories.isVisible, true),
      )
      .orderBy(asc(schema.categories.position));

    // Nest children under their parents — the two systems stay independent.
    const byId = new Map(rows.map((r) => [r.id, { ...r, children: [] as typeof rows }]));
    const roots: (typeof rows)[number][] = [];
    for (const row of rows) {
      const node = byId.get(row.id);
      if (!node) continue;
      if (row.parentId && byId.has(row.parentId)) byId.get(row.parentId)?.children.push(node);
      else roots.push(node);
    }
    return roots;
  }

  async listBrands(params: { page?: number; pageSize?: number; featured?: boolean }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 50));
    const where = params.featured
      ? and(eq(schema.brands.isVisible, true), eq(schema.brands.isFeatured, true))
      : eq(schema.brands.isVisible, true);

    const items = await this.db
      .select()
      .from(schema.brands)
      .where(where)
      .orderBy(asc(schema.brands.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.brands)
      .where(where);

    const total = countRow?.count ?? 0;
    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasNext: page * pageSize < total,
      /** Pre-grouped for the A–Z brand mega-menu. */
      alphabet: [...new Set(items.map((b) => b.name.charAt(0).toUpperCase()))].sort(),
    };
  }

  async getBrand(slug: string) {
    const brand = await this.db.query.brands.findFirst({
      where: eq(schema.brands.slug, slug),
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }
}
