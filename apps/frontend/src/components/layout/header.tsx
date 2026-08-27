'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, User } from 'lucide-react';
import { useI18n } from '@/i18n/i18n-provider';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useTheme } from '@/theme/theme-provider';
import type { NavigationPayload } from '@/lib/server-api';
import { cn } from '@/lib/utils';
import { LocaleToggle } from './locale-toggle';
import { BrandMegaMenu, CategoryMegaMenu } from './mega-menu';

/**
 * Sticky two-line header + top category bar.
 *
 * Line 1 — logo, unified search, account/wishlist/cart, language toggle.
 * Line 2 — "Browse Category" mega-menu, brand A–Z mega-menu, utility links.
 * Line 3 — the top category bar (the first of the two parallel systems).
 *
 * Every item comes from the `menu_items` table, so the admin can reorder,
 * hide or add entries without a deploy.
 */
export function Header({ navigation }: { navigation: NavigationPayload }) {
  const { t, pick } = useI18n();
  const { token } = useTheme();
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore((s) => s.lines.reduce((sum, l) => sum + l.quantity, 0));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const primary = navigation.HEADER_PRIMARY ?? [];
  const topBar = navigation.TOP_CATEGORY_BAR ?? [];
  const megaCategory = navigation.MEGA_CATEGORY ?? [];
  const megaBrand = navigation.MEGA_BRAND ?? [];

  return (
    <header
      className={cn(
        'bg-canvas/95 sticky top-0 z-50 w-full border-b border-line backdrop-blur transition-shadow',
        scrolled && 'shadow-header',
      )}
    >
      {/* Announcement strip — editable via the theme tokens. */}
      <div className="bg-ink text-ink-inverse">
        <div className="mx-auto flex max-w-container items-center justify-center px-4 py-1.5 text-center text-[11px] tracking-wide">
          {pick(token('brand.announcement.en'), token('brand.announcement.bn'))}
        </div>
      </div>

      {/* Line 1 */}
      <div className="mx-auto flex max-w-container items-center gap-4 px-4 py-3">
        <button
          type="button"
          className="rounded-sm p-2 text-ink-soft lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="flex shrink-0 items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight text-ink">
            {pick(token('brand.name') || 'Aabha', 'আভা')}
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-primary-strong sm:inline">
            Bangladesh
          </span>
        </Link>

        <form
          role="search"
          className="hidden flex-1 items-center gap-2 rounded-pill border border-line bg-surface px-4 py-2 focus-within:border-primary md:flex"
          onSubmit={(e) => e.preventDefault()}
        >
          <Search aria-hidden className="h-4 w-4 text-ink-subtle" />
          <input
            type="search"
            placeholder={t.common.search}
            aria-label={t.common.search}
            className="placeholder:text-ink-subtle/70 w-full bg-transparent text-sm text-ink outline-none"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <LocaleToggle compact />
          <Link
            href="/wishlist"
            className="rounded-sm p-2 text-ink-soft transition-colors hover:text-primary-strong"
            aria-label={t.common.wishlist}
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href={user ? '/account' : '/login'}
            className="flex items-center gap-1.5 rounded-sm p-2 text-ink-soft transition-colors hover:text-primary-strong"
          >
            <User className="h-5 w-5" />
            <span className="hidden text-sm lg:inline">
              {user ? (user.fullName ?? t.common.account) : t.common.signIn}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => useCartStore.getState().open()}
            className="relative rounded-sm p-2 text-ink-soft transition-colors hover:text-primary-strong"
            aria-label={t.common.cart}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-accent px-1 text-[10px] font-semibold text-ink">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Line 2 */}
      <div className="border-line/70 border-t">
        <div className="mx-auto flex max-w-container items-center gap-5 px-4 py-2">
          <CategoryMegaMenu items={megaCategory} />
          <BrandMegaMenu items={megaBrand} />
          <nav className="ml-auto hidden items-center gap-5 md:flex">
            {primary.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="text-sm text-ink-soft transition-colors hover:text-primary-strong"
              >
                {pick(item.labelEn, item.labelBn)}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Top category bar — parallel system #1 */}
      {topBar.length > 0 && (
        <div className="border-line/70 border-t bg-surface-muted">
          <div className="mx-auto flex max-w-container items-center gap-1 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {topBar.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                data-segment={item.segment}
                className="flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-primary-soft hover:text-ink"
              >
                {pick(item.labelEn, item.labelBn)}
                {item.badgeText && (
                  <span className="rounded-pill bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink">
                    {item.badgeText}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="animate-slide-down border-t border-line bg-surface px-4 py-4 lg:hidden">
          <form
            role="search"
            className="mb-4 flex items-center gap-2 rounded-pill border border-line px-4 py-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <Search aria-hidden className="h-4 w-4 text-ink-subtle" />
            <input
              type="search"
              placeholder={t.common.search}
              aria-label={t.common.search}
              className="w-full bg-transparent text-sm outline-none"
            />
          </form>
          <nav className="grid gap-1">
            {[...topBar, ...primary].map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-sm px-2 py-2 text-sm text-ink-soft hover:bg-surface-muted"
              >
                {pick(item.labelEn, item.labelBn)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
