import { customAlphabet } from 'nanoid';
import { timestamp } from 'drizzle-orm/pg-core';

/**
 * URL-safe, sortable-enough public identifiers. 21 chars ≈ 121 bits of entropy,
 * collision-safe for the volumes Aabha will realistically see.
 */
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
export const createId = customAlphabet(alphabet, 21);

/** Every table gets the same created/updated pair for consistent auditing. */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
