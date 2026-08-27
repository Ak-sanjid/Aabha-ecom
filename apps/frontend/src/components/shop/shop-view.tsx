'use client';

import { SideCategoryPanel } from '@/components/layout/side-category-panel';
import { useI18n } from '@/i18n/i18n-provider';
import type { NavNode } from '@/lib/server-api';

/**
 * Listing-page shell. The collapsible left category panel appears only here
 * (never on the home page or PDP), and runs independently of the top bar.
 * Milestone 2 fills the grid with real products and AJAX filters.
 */
export function ShopView({ sections }: { sections: NavNode[] }) {
  const { t, pick } = useI18n();

  return (
    <div className="aabha-container py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-ink-subtle">
        <ol className="flex items-center gap-1.5">
          <li>{pick('Home', 'হোম')}</li>
          <li aria-hidden>/</li>
          <li className="text-ink">{pick('Shop', 'শপ')}</li>
        </ol>
      </nav>

      <div className="flex flex-col gap-6 lg:flex-row">
        <SideCategoryPanel sections={sections} />

        <section className="flex-1">
          <div className="mb-4 flex items-baseline justify-between">
            <h1 className="font-display text-3xl text-ink">{pick('All products', 'সব পণ্য')}</h1>
            <p className="text-sm text-ink-subtle">0 {t.shop.results}</p>
          </div>

          <div className="aabha-card grid place-items-center p-16 text-center">
            <p className="font-display text-xl text-ink">{t.shop.comingSoon}</p>
            <p className="mt-2 max-w-md text-sm text-ink-subtle">{t.shop.comingSoonBody}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
