'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import type { NavigationPayload } from '@/lib/server-api';
import { Footer } from './footer';
import { Header } from './header';

/**
 * Chooses the chrome for the current route: the storefront gets the sticky
 * header + footer, while `/admin` renders its own layout (shared design
 * system, different shell).
 */
export function SiteChrome({
  navigation,
  children,
}: {
  navigation: NavigationPayload;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <Header navigation={navigation} />
      <main className="flex-1">{children}</main>
      <Footer navigation={navigation} />
    </div>
  );
}
