import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE, type Database } from 'src/db/database.module';
import * as schema from 'src/db/schema';
import type { AuditContext } from 'src/common/utils';

/**
 * Central audit trail. Every admin mutation must call `record()` so the
 * "who changed what, when" requirement holds across modules.
 */
@Injectable()
export class AuditService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async record(input: {
    action: string;
    entity: string;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
    context?: AuditContext;
  }): Promise<void> {
    await this.db.insert(schema.auditLogs).values({
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      before: (input.before as object) ?? null,
      after: (input.after as object) ?? null,
      actorId: input.context?.actorId ?? null,
      actorEmail: input.context?.actorEmail ?? null,
      ip: input.context?.ip ?? null,
      userAgent: input.context?.userAgent ?? null,
    });
  }

  async list(params: { page?: number; pageSize?: number; entity?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
    const where = params.entity ? eq(schema.auditLogs.entity, params.entity) : undefined;

    const items = await this.db
      .select()
      .from(schema.auditLogs)
      .where(where)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.auditLogs)
      .where(where);

    const total = countRow?.count ?? 0;
    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasNext: page * pageSize < total,
    };
  }
}
