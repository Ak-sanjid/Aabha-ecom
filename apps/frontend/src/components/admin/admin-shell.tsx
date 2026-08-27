'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import {
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Package,
  Palette,
  ShoppingCart,
} from 'lucide-react';
import { useI18n } from '@/i18n/i18n-provider';
import { authApi } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'STAFF'];

/**
 * Role-gated admin shell. It shares the design-system tokens with the
 * storefront but has its own layout, as specified.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, clear } = useAuthStore();

  useEffect(() => {
    if (status === 'anonymous' || (user && !ADMIN_ROLES.includes(user.role))) {
      router.replace('/login');
    }
  }, [status, user, router]);

  const nav = [
    { href: '/admin', label: t.admin.dashboard, icon: LayoutDashboard },
    { href: '/admin/theme', label: t.admin.theme, icon: Palette },
    { href: '/admin/navigation', label: t.admin.navigation, icon: MenuIcon },
    { href: '/admin/catalog', label: t.admin.catalog, icon: Package },
    { href: '/admin/orders', label: t.admin.orders, icon: ShoppingCart },
  ];

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-sm text-ink-subtle">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface md:block">
        <div className="border-b border-line px-5 py-4">
          <Link href="/" className="font-display text-xl font-semibold text-ink">
            Aabha
          </Link>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-primary-strong">
            {t.admin.title}
          </p>
        </div>
        <nav className="space-y-0.5 p-3">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-primary-soft font-medium text-ink'
                    : 'text-ink-soft hover:bg-surface-muted hover:text-ink',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
          <div>
            <p className="text-sm font-medium text-ink">{user.fullName ?? user.email}</p>
            <p className="text-xs text-ink-subtle">{user.role.replace('_', ' ')}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await authApi.logout().catch(() => undefined);
              clear();
              router.push('/');
            }}
            className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-primary hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t.common.signOut}
          </button>
        </header>
        <main className="flex-1 overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
}
