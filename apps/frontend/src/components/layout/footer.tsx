'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/i18n-provider';
import { useTheme } from '@/theme/theme-provider';
import type { NavigationPayload } from '@/lib/server-api';

export function Footer({ navigation }: { navigation: NavigationPayload }) {
  const { t, pick } = useI18n();
  const { token } = useTheme();
  const columns = navigation.TOP_CATEGORY_BAR ?? [];

  return (
    <footer className="mt-16 border-t border-line bg-surface-muted">
      <div className="mx-auto grid max-w-container gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl font-semibold text-ink">
            {pick(token('brand.name') || 'Aabha', 'আভা')}
          </p>
          <p className="mt-2 max-w-sm text-sm text-ink-subtle">
            {pick(token('brand.tagline.en'), token('brand.tagline.bn'))}
          </p>
          <p className="mt-4 text-xs text-ink-subtle">{t.footer.builtWith}</p>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            {t.header.shopByCategory}
          </p>
          <ul className="space-y-1.5">
            {columns.slice(0, 6).map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="text-sm text-ink-soft transition-colors hover:text-primary-strong"
                >
                  {pick(item.labelEn, item.labelBn)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            {t.common.account}
          </p>
          <ul className="space-y-1.5">
            <li>
              <Link href="/login" className="text-sm text-ink-soft hover:text-primary-strong">
                {t.common.signIn}
              </Link>
            </li>
            <li>
              <Link
                href="/orders/track"
                className="text-sm text-ink-soft hover:text-primary-strong"
              >
                {t.header.trackOrder}
              </Link>
            </li>
            <li>
              <Link href="/admin" className="text-sm text-ink-soft hover:text-primary-strong">
                {t.admin.title}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-container flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-ink-subtle sm:flex-row">
          <p>
            © {new Date().getFullYear()} {token('brand.name') || 'Aabha'}. {t.footer.rights}
          </p>
          <p>Dhaka, Bangladesh</p>
        </div>
      </div>
    </footer>
  );
}
