import { Injectable } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';

export interface AuditContext {
  actorId?: string | null;
  actorEmail?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

/** Shape of a paginated API response used by every list endpoint. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
  };
}

/**
 * Bangladeshi mobile numbers arrive in half a dozen shapes
 * (`01712345678`, `+8801712345678`, `8801712345678`, `01712-345678`).
 * Everything is normalised to the canonical local form `01XXXXXXXXX`.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (/^880\d{10}$/.test(digits)) return `0${digits.slice(3)}`;
  if (/^0\d{10}$/.test(digits)) return digits;
  if (/^\d{10}$/.test(digits) && digits.startsWith('1')) return `0${digits}`;
  return null;
}

export function isValidBdPhone(input: string): boolean {
  const normalized = normalizePhone(input);
  return normalized !== null && /^01[3-9]\d{8}$/.test(normalized);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(input: string): boolean {
  return EMAIL_RE.test(input.trim());
}

/** Classifies the single unified login input into an identifier kind. */
export function classifyIdentifier(raw: string): {
  kind: 'email' | 'phone' | 'unknown';
  value: string;
} {
  const trimmed = raw.trim();
  if (isEmail(trimmed)) return { kind: 'email', value: trimmed.toLowerCase() };
  const phone = normalizePhone(trimmed);
  if (phone && isValidBdPhone(phone)) return { kind: 'phone', value: phone };
  return { kind: 'unknown', value: trimmed };
}

@Injectable()
export class AppInfoService {
  constructor(private readonly config: ConfigService) {}

  get name(): string {
    return this.config.get<string>('app.name') ?? 'Aabha';
  }
}
