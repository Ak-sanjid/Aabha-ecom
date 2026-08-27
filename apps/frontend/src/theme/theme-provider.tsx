'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ThemePayload } from '@/lib/server-api';
import { FALLBACK_TOKENS } from './tokens';

interface ThemeContextValue {
  theme: ThemePayload | null;
  token: (key: string) => string;
  flag: (key: string) => boolean;
  brandName: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Exposes the DB-driven design tokens to client components. The actual styling
 * happens through CSS variables injected server-side, so there is no flash of
 * unstyled content — this context is for logic (flags, brand strings, previews).
 */
export function ThemeProvider({
  theme,
  children,
}: {
  theme: ThemePayload | null;
  children: ReactNode;
}) {
  const value = useMemo<ThemeContextValue>(() => {
    const lookup = (key: string) => theme?.tokens[key] ?? FALLBACK_TOKENS[key] ?? '';
    return {
      theme,
      token: lookup,
      flag: (key: string) => lookup(key) === 'true',
      brandName: lookup('brand.name') || 'Aabha',
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
