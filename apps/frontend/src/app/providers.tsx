'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { I18nProvider } from '@/i18n/i18n-provider';
import type { Locale } from '@/i18n/dictionaries';
import { authApi } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { ThemeProvider } from '@/theme/theme-provider';
import type { ThemePayload } from '@/lib/server-api';
import { Toaster } from '@/components/ui/toaster';

function SessionBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((user) => {
        if (!cancelled) setUser(user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  return null;
}

export function Providers({
  theme,
  locale,
  children,
}: {
  theme: ThemePayload | null;
  locale: Locale;
  children: ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <I18nProvider initialLocale={locale}>
          <SessionBootstrap />
          {children}
          <Toaster />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
