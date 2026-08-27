import type { ThemePayload } from '@/lib/server-api';

/**
 * Fallback tokens used only if the API is unreachable on first paint. They
 * mirror the seeded defaults so the site never renders unstyled — but the
 * database always wins.
 */
export const FALLBACK_TOKENS: Record<string, string> = {
  'color.canvas': '#FDFBF7',
  'color.surface': '#FFFFFF',
  'color.surface.muted': '#F7F1E7',
  'color.surface.elevated': '#FFFDF9',
  'color.border': '#EADFCB',
  'color.border.strong': '#D9C7A6',
  'color.ink': '#211C1A',
  'color.ink.soft': '#4A423D',
  'color.ink.subtle': '#7A6E66',
  'color.ink.inverse': '#FFFCF6',
  'color.primary': '#C9A227',
  'color.primary.soft': '#F3E7C8',
  'color.primary.strong': '#A8851A',
  'color.accent': '#E0A899',
  'color.accent.soft': '#F8E6E0',
  'color.success': '#2F7A5B',
  'color.warning': '#C77B24',
  'color.danger': '#B3453C',
  'color.info': '#3F6C86',
  'color.review.surface': '#F1F1F0',
  'color.review.border': '#DCDCDA',
  'color.review.ink': '#565655',
  'color.review.star': '#C9A227',
  'font.display': "'Cormorant Garamond', Georgia, serif",
  'font.body': "'Inter', system-ui, sans-serif",
  'font.bangla': "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
  'radius.sm': '6px',
  'radius.md': '12px',
  'radius.lg': '20px',
  'radius.pill': '999px',
  'shadow.card': '0 1px 2px rgba(33,28,26,0.04), 0 8px 24px rgba(33,28,26,0.06)',
  'shadow.header': '0 1px 0 rgba(33,28,26,0.06)',
  'layout.container': '1280px',
  'brand.name': 'Aabha',
};

/** `color.primary.soft` → `--aabha-color-primary-soft` */
export function tokenToCssVar(key: string): string {
  return `--aabha-${key.replace(/\./g, '-')}`;
}

/**
 * Only design tokens become CSS variables; identity strings and feature flags
 * are consumed as data, not styles.
 */
const STYLE_PREFIXES = ['color.', 'font.', 'radius.', 'shadow.', 'layout.', 'spacing.'];

export function buildCssVariables(tokens: Record<string, string>): string {
  const merged = { ...FALLBACK_TOKENS, ...tokens };
  const declarations = Object.entries(merged)
    .filter(([key]) => STYLE_PREFIXES.some((prefix) => key.startsWith(prefix)))
    .map(([key, value]) => `  ${tokenToCssVar(key)}: ${value};`)
    .join('\n');
  return `:root {\n${declarations}\n}`;
}

/**
 * Men's, women's and makeup pages get distinct accents from the same palette.
 * Each segment is emitted as a `[data-segment="MEN"]` scope so a page can opt
 * in by setting one attribute.
 */
export function buildSegmentVariables(segments: Record<string, Record<string, string>>): string {
  return Object.entries(segments)
    .map(([segment, tokens]) => {
      const declarations = Object.entries(tokens)
        .filter(([key]) => STYLE_PREFIXES.some((prefix) => key.startsWith(prefix)))
        .map(([key, value]) => `  ${tokenToCssVar(key)}: ${value};`)
        .join('\n');
      return `[data-segment="${segment}"] {\n${declarations}\n}`;
    })
    .join('\n');
}

export function buildThemeStylesheet(theme: ThemePayload | null): string {
  const tokens = theme?.tokens ?? {};
  const segments = theme?.segments ?? {};
  return [buildCssVariables(tokens), buildSegmentVariables(segments)].join('\n\n');
}

export function getToken(theme: ThemePayload | null, key: string): string {
  return theme?.tokens[key] ?? FALLBACK_TOKENS[key] ?? '';
}

export function isFlagEnabled(theme: ThemePayload | null, key: string): boolean {
  return (theme?.tokens[key] ?? 'false') === 'true';
}
