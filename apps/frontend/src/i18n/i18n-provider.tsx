'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { dictionaries, LOCALE_COOKIE, type Dictionary, type Locale } from './dictionaries';

interface I18nContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  /** Picks the right per-locale DB column, e.g. `pick(p.titleEn, p.titleBn)`. */
  pick: <T>(en: T, bn: T) => T;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Both dictionaries ship with the bundle, so the header toggle switches the
 * entire site instantly with no reload and no round-trip. The choice is
 * persisted in a cookie the server reads on the next request.
 */
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    document.documentElement.lang = next;
    document.documentElement.dataset.locale = next;
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: dictionaries[locale],
      setLocale,
      toggleLocale: () => setLocale(locale === 'en' ? 'bn' : 'en'),
      pick: <T,>(en: T, bn: T) => (locale === 'bn' ? bn : en),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>');
  return context;
}
