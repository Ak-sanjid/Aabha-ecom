/**
 * The Aabha design-token catalogue.
 *
 * These are the *defaults* seeded into `theme_settings`. At runtime the admin
 * panel edits the DB rows and the storefront picks the change up on the next
 * boot/refresh — no rebuild, no redeploy. Nothing here may be hardcoded in a
 * component.
 *
 * Palette rules enforced by the brief:
 *   • No pure black anywhere — `color.ink` is a warm off-black.
 *   • Grey tones are reserved strictly for the customer-review section
 *     (`color.review.*`).
 *   • Men's and women's/makeup pages get distinct, non-clashing accents that
 *     still live inside the same creamy-gold brand palette (`segmentValues`).
 */
export type ThemeTokenType =
  'COLOR' | 'FONT' | 'RADIUS' | 'SPACING' | 'SHADOW' | 'SIZE' | 'TEXT' | 'ASSET' | 'FLAG';

export interface ThemeTokenSeed {
  key: string;
  type: ThemeTokenType;
  group: string;
  label: string;
  description?: string;
  value: string;
  segmentValues?: Record<string, string>;
  isPublic?: boolean;
}

export const DEFAULT_THEME_KEY = 'aabha-signature';

export const DEFAULT_THEME_TOKENS: ThemeTokenSeed[] = [
  // ---- Surfaces -----------------------------------------------------------
  {
    key: 'color.canvas',
    type: 'COLOR',
    group: 'surface',
    label: 'Page canvas',
    description: 'Creamy white base used behind every page.',
    value: '#FDFBF7',
  },
  {
    key: 'color.surface',
    type: 'COLOR',
    group: 'surface',
    label: 'Card surface',
    value: '#FFFFFF',
  },
  {
    key: 'color.surface.muted',
    type: 'COLOR',
    group: 'surface',
    label: 'Muted surface',
    description: 'Soft cream used for section bands and hover states.',
    value: '#F7F1E7',
  },
  {
    key: 'color.surface.elevated',
    type: 'COLOR',
    group: 'surface',
    label: 'Elevated surface',
    value: '#FFFDF9',
  },
  {
    key: 'color.border',
    type: 'COLOR',
    group: 'surface',
    label: 'Hairline border',
    value: '#EADFCB',
  },
  {
    key: 'color.border.strong',
    type: 'COLOR',
    group: 'surface',
    label: 'Strong border',
    value: '#D9C7A6',
  },

  // ---- Ink (never pure black) --------------------------------------------
  {
    key: 'color.ink',
    type: 'COLOR',
    group: 'text',
    label: 'Primary ink (off-black)',
    description: 'Brand off-black. Pure #000000 is banned across the system.',
    value: '#211C1A',
  },
  {
    key: 'color.ink.soft',
    type: 'COLOR',
    group: 'text',
    label: 'Secondary ink',
    value: '#4A423D',
  },
  {
    key: 'color.ink.subtle',
    type: 'COLOR',
    group: 'text',
    label: 'Subtle ink',
    value: '#7A6E66',
  },
  {
    key: 'color.ink.inverse',
    type: 'COLOR',
    group: 'text',
    label: 'Inverse ink',
    value: '#FFFCF6',
  },

  // ---- Brand / accents ----------------------------------------------------
  {
    key: 'color.primary',
    type: 'COLOR',
    group: 'brand',
    label: 'Primary (light gold)',
    description: 'Aabha signature gold. Segment overrides keep men’s pages distinct.',
    value: '#C9A227',
    segmentValues: {
      WOMEN: '#C9A227',
      MAKEUP: '#C08552',
      MEN: '#8C7A5B',
    },
  },
  {
    key: 'color.primary.soft',
    type: 'COLOR',
    group: 'brand',
    label: 'Primary soft wash',
    value: '#F3E7C8',
    segmentValues: {
      WOMEN: '#F3E7C8',
      MAKEUP: '#F6E3D6',
      MEN: '#E9E3D6',
    },
  },
  {
    key: 'color.primary.strong',
    type: 'COLOR',
    group: 'brand',
    label: 'Primary strong',
    value: '#A8851A',
    segmentValues: {
      WOMEN: '#A8851A',
      MAKEUP: '#A26A3D',
      MEN: '#6E6047',
    },
  },
  {
    key: 'color.accent',
    type: 'COLOR',
    group: 'brand',
    label: 'Accent (pinkish gold)',
    description: 'Rose-gold accent for CTAs, badges and highlights.',
    value: '#E0A899',
    segmentValues: {
      WOMEN: '#E0A899',
      MAKEUP: '#D98A93',
      MEN: '#9FB3AE',
    },
  },
  {
    key: 'color.accent.soft',
    type: 'COLOR',
    group: 'brand',
    label: 'Accent soft',
    value: '#F8E6E0',
    segmentValues: {
      WOMEN: '#F8E6E0',
      MAKEUP: '#F9E1E4',
      MEN: '#E4EDEA',
    },
  },

  // ---- Status -------------------------------------------------------------
  { key: 'color.success', type: 'COLOR', group: 'status', label: 'Success', value: '#2F7A5B' },
  { key: 'color.warning', type: 'COLOR', group: 'status', label: 'Warning', value: '#C77B24' },
  { key: 'color.danger', type: 'COLOR', group: 'status', label: 'Danger', value: '#B3453C' },
  { key: 'color.info', type: 'COLOR', group: 'status', label: 'Info', value: '#3F6C86' },

  // ---- Reviews (the ONLY place grey is allowed) ---------------------------
  {
    key: 'color.review.surface',
    type: 'COLOR',
    group: 'reviews',
    label: 'Review surface (grey)',
    description: 'Grey tones are reserved exclusively for the review section.',
    value: '#F1F1F0',
  },
  {
    key: 'color.review.border',
    type: 'COLOR',
    group: 'reviews',
    label: 'Review border (grey)',
    value: '#DCDCDA',
  },
  {
    key: 'color.review.ink',
    type: 'COLOR',
    group: 'reviews',
    label: 'Review text (grey)',
    value: '#565655',
  },
  {
    key: 'color.review.star',
    type: 'COLOR',
    group: 'reviews',
    label: 'Review star',
    value: '#C9A227',
  },

  // ---- Typography ---------------------------------------------------------
  {
    key: 'font.display',
    type: 'FONT',
    group: 'typography',
    label: 'Display font stack',
    value: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
  },
  {
    key: 'font.body',
    type: 'FONT',
    group: 'typography',
    label: 'Body font stack',
    value: "'Inter', 'Hind Siliguri', system-ui, -apple-system, sans-serif",
  },
  {
    key: 'font.bangla',
    type: 'FONT',
    group: 'typography',
    label: 'Bangla font stack',
    description: 'Applied automatically when the locale toggle is set to Bangla.',
    value: "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
  },
  {
    key: 'font.size.base',
    type: 'SIZE',
    group: 'typography',
    label: 'Base font size',
    value: '16px',
  },
  {
    key: 'font.weight.heading',
    type: 'SIZE',
    group: 'typography',
    label: 'Heading weight',
    value: '600',
  },

  // ---- Shape --------------------------------------------------------------
  { key: 'radius.sm', type: 'RADIUS', group: 'shape', label: 'Radius small', value: '6px' },
  { key: 'radius.md', type: 'RADIUS', group: 'shape', label: 'Radius medium', value: '12px' },
  { key: 'radius.lg', type: 'RADIUS', group: 'shape', label: 'Radius large', value: '20px' },
  { key: 'radius.pill', type: 'RADIUS', group: 'shape', label: 'Radius pill', value: '999px' },
  {
    key: 'shadow.card',
    type: 'SHADOW',
    group: 'shape',
    label: 'Card shadow',
    value: '0 1px 2px rgba(33,28,26,0.04), 0 8px 24px rgba(33,28,26,0.06)',
  },
  {
    key: 'shadow.header',
    type: 'SHADOW',
    group: 'shape',
    label: 'Header shadow',
    value: '0 1px 0 rgba(33,28,26,0.06)',
  },
  {
    key: 'layout.container',
    type: 'SIZE',
    group: 'shape',
    label: 'Container max width',
    value: '1280px',
  },

  // ---- Brand identity strings --------------------------------------------
  { key: 'brand.name', type: 'TEXT', group: 'identity', label: 'Brand name', value: 'Aabha' },
  {
    key: 'brand.tagline.en',
    type: 'TEXT',
    group: 'identity',
    label: 'Tagline (English)',
    value: 'Radiance, thoughtfully curated.',
  },
  {
    key: 'brand.tagline.bn',
    type: 'TEXT',
    group: 'identity',
    label: 'Tagline (Bangla)',
    value: 'যত্নে বাছাই করা উজ্জ্বলতা।',
  },
  {
    key: 'brand.logoUrl',
    type: 'ASSET',
    group: 'identity',
    label: 'Logo URL',
    value: '',
  },
  {
    key: 'brand.announcement.en',
    type: 'TEXT',
    group: 'identity',
    label: 'Announcement bar (English)',
    value: 'Free delivery on orders over ৳2,000 · 100% authentic products',
  },
  {
    key: 'brand.announcement.bn',
    type: 'TEXT',
    group: 'identity',
    label: 'Announcement bar (Bangla)',
    value: '৳২,০০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি · ১০০% অরিজিনাল পণ্য',
  },

  // ---- Feature flags ------------------------------------------------------
  {
    key: 'feature.aiChat',
    type: 'FLAG',
    group: 'features',
    label: 'Floating AI assistant',
    value: 'true',
  },
  {
    key: 'feature.sideCategoryPanel',
    type: 'FLAG',
    group: 'features',
    label: 'Left category panel on listing pages',
    value: 'true',
  },
  {
    key: 'feature.localeToggle',
    type: 'FLAG',
    group: 'features',
    label: 'EN/BN header toggle',
    value: 'true',
  },
];
