'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '@/i18n/i18n-provider';
import type { NavNode } from '@/lib/server-api';
import { cn } from '@/lib/utils';

/**
 * Collapsible left-hand category panel — the second, independent category
 * system. It only appears on listing pages, exactly as specified, and its
 * contents come from the SIDE_CATEGORY_PANEL menu location.
 */
export function SideCategoryPanel({ sections }: { sections: NavNode[] }) {
  const { t, pick } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.id, true])),
  );

  if (sections.length === 0) return null;

  return (
    <aside
      className={cn('shrink-0 transition-all duration-200', collapsed ? 'w-12' : 'w-full lg:w-64')}
      aria-label={t.shop.sections}
    >
      <div className="rounded-lg border border-line bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          {!collapsed && (
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
              {t.shop.sections}
            </p>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand filters' : 'Collapse filters'}
            className="rounded-sm p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {!collapsed && (
          <div className="space-y-1">
            {sections.map((section) => {
              const isOpen = openSections[section.id] ?? true;
              return (
                <div key={section.id} className="border-line/60 border-b pb-1 last:border-none">
                  <button
                    type="button"
                    onClick={() => setOpenSections((prev) => ({ ...prev, [section.id]: !isOpen }))}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between px-1 py-2 text-sm font-medium text-ink"
                  >
                    {pick(section.labelEn, section.labelBn)}
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        'h-4 w-4 text-ink-subtle transition-transform',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  {isOpen && (
                    <ul className="space-y-0.5 pb-1.5 pl-1">
                      {section.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={child.href}
                            className="block rounded-sm px-1.5 py-1 text-sm text-ink-soft transition-colors hover:bg-surface-muted hover:text-primary-strong"
                          >
                            {pick(child.labelEn, child.labelBn)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
