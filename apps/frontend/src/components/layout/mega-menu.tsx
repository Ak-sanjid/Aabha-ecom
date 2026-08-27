'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/i18n/i18n-provider';
import type { NavNode } from '@/lib/server-api';
import { cn } from '@/lib/utils';

/**
 * "Browse Category" mega-menu. Content is entirely DB-driven: whatever the
 * admin puts under MEGA_CATEGORY renders here, in the current locale.
 */
export function CategoryMegaMenu({ items }: { items: NavNode[] }) {
  const { t, pick } = useI18n();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1.5 rounded-pill bg-primary-soft px-4 text-sm font-medium text-ink transition-colors hover:bg-primary"
      >
        {t.header.browseCategory}
        <ChevronDown
          aria-hidden
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 w-[min(56rem,calc(100vw-2rem))] animate-slide-down pt-2">
          <div className="grid grid-cols-2 gap-6 rounded-lg border border-line bg-surface-elevated p-6 shadow-card md:grid-cols-3">
            {items.map((group) => (
              <div key={group.id} data-segment={group.segment}>
                <Link
                  href={group.href}
                  className="mb-2 block font-display text-lg font-semibold text-ink hover:text-primary-strong"
                >
                  {pick(group.labelEn, group.labelBn)}
                </Link>
                <ul className="space-y-1.5">
                  {group.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={child.href}
                        className="text-sm text-ink-soft transition-colors hover:text-primary-strong"
                      >
                        {pick(child.labelEn, child.labelBn)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Brand mega-menu, grouped A–Z from the `groupKey` column. */
export function BrandMegaMenu({ items }: { items: NavNode[] }) {
  const { t, pick } = useI18n();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const groups = items.reduce<Record<string, NavNode[]>>((acc, item) => {
    const key = (item.groupKey ?? item.labelEn.charAt(0)).toUpperCase();
    acc[key] = [...(acc[key] ?? []), item];
    return acc;
  }, {});
  const letters = Object.keys(groups).sort();

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1.5 px-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
      >
        {t.header.brands}
        <ChevronDown
          aria-hidden
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 w-[min(48rem,calc(100vw-2rem))] animate-slide-down pt-2">
          <div className="rounded-lg border border-line bg-surface-elevated p-6 shadow-card">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-subtle">
              {t.header.allBrands}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
              {letters.map((letter) => (
                <div key={letter}>
                  <p className="mb-1.5 font-display text-base font-semibold text-primary-strong">
                    {letter}
                  </p>
                  <ul className="space-y-1">
                    {(groups[letter] ?? []).map((brand) => (
                      <li key={brand.id}>
                        <Link
                          href={brand.href}
                          className="text-sm text-ink-soft transition-colors hover:text-primary-strong"
                        >
                          {pick(brand.labelEn, brand.labelBn)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
