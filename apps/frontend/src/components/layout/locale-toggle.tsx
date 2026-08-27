'use client';

import { Globe } from 'lucide-react';
import { useI18n } from '@/i18n/i18n-provider';

/** Switches the whole site between English and Bangla instantly, no reload. */
export function LocaleToggle({ compact = false }: { compact?: boolean }) {
  const { locale, t, toggleLocale } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={t.common.languageLabel}
      title={t.common.languageLabel}
      className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-primary hover:text-ink"
    >
      <Globe aria-hidden className="h-3.5 w-3.5" />
      {compact ? (locale === 'en' ? 'বাং' : 'EN') : t.common.language}
    </button>
  );
}
