import type { Config } from 'tailwindcss';

/**
 * Every colour, font and radius here resolves to a CSS custom property that is
 * injected at runtime from the `theme_settings` table. Changing a token in the
 * admin panel restyles the site with no rebuild — so never hardcode a hex here.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--aabha-color-canvas)',
        surface: {
          DEFAULT: 'var(--aabha-color-surface)',
          muted: 'var(--aabha-color-surface-muted)',
          elevated: 'var(--aabha-color-surface-elevated)',
        },
        line: {
          DEFAULT: 'var(--aabha-color-border)',
          strong: 'var(--aabha-color-border-strong)',
        },
        ink: {
          DEFAULT: 'var(--aabha-color-ink)',
          soft: 'var(--aabha-color-ink-soft)',
          subtle: 'var(--aabha-color-ink-subtle)',
          inverse: 'var(--aabha-color-ink-inverse)',
        },
        primary: {
          DEFAULT: 'var(--aabha-color-primary)',
          soft: 'var(--aabha-color-primary-soft)',
          strong: 'var(--aabha-color-primary-strong)',
        },
        accent: {
          DEFAULT: 'var(--aabha-color-accent)',
          soft: 'var(--aabha-color-accent-soft)',
        },
        success: 'var(--aabha-color-success)',
        warning: 'var(--aabha-color-warning)',
        danger: 'var(--aabha-color-danger)',
        info: 'var(--aabha-color-info)',
        // Grey lives here and ONLY here — the customer review section.
        review: {
          surface: 'var(--aabha-color-review-surface)',
          border: 'var(--aabha-color-review-border)',
          ink: 'var(--aabha-color-review-ink)',
          star: 'var(--aabha-color-review-star)',
        },
      },
      fontFamily: {
        display: 'var(--aabha-font-display)',
        body: 'var(--aabha-font-body)',
        bangla: 'var(--aabha-font-bangla)',
      },
      borderRadius: {
        sm: 'var(--aabha-radius-sm)',
        md: 'var(--aabha-radius-md)',
        lg: 'var(--aabha-radius-lg)',
        pill: 'var(--aabha-radius-pill)',
      },
      boxShadow: {
        card: 'var(--aabha-shadow-card)',
        header: 'var(--aabha-shadow-header)',
      },
      maxWidth: {
        container: 'var(--aabha-layout-container)',
      },
      keyframes: {
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'slide-down': 'slide-down 160ms ease-out',
        'toast-in': 'toast-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
