'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, CreditCard, Palette, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/i18n-provider';
import { useTheme } from '@/theme/theme-provider';

const PALETTE_KEYS = [
  'color.canvas',
  'color.surface.muted',
  'color.primary.soft',
  'color.primary',
  'color.primary.strong',
  'color.accent',
  'color.accent.soft',
  'color.ink',
];

const SEGMENTS = [
  { key: 'WOMEN', labelEn: "Women's & skincare", labelBn: 'নারী ও স্কিনকেয়ার' },
  { key: 'MAKEUP', labelEn: 'Makeup', labelBn: 'মেকআপ' },
  { key: 'MEN', labelEn: "Men's grooming", labelBn: 'পুরুষদের গ্রুমিং' },
];

export function HomeView() {
  const { t, pick } = useI18n();
  const { token, theme } = useTheme();

  const trust = [
    { icon: BadgeCheck, title: t.home.trustAuthentic, body: t.home.trustAuthenticBody },
    { icon: Truck, title: t.home.trustDelivery, body: t.home.trustDeliveryBody },
    { icon: CreditCard, title: t.home.trustPayments, body: t.home.trustPaymentsBody },
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-surface-muted">
        <div className="aabha-container grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary-strong">
              {t.home.heroEyebrow}
            </p>
            <h1 className="font-display text-4xl leading-tight text-ink md:text-6xl">
              {pick(token('brand.tagline.en') || t.home.heroTitle, token('brand.tagline.bn'))}
            </h1>
            <p className="mt-4 max-w-md text-base text-ink-soft">{t.home.heroBody}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/shop">
                <Button size="lg">
                  {t.home.shopNow}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/shop">
                <Button size="lg" variant="outline">
                  {t.home.exploreBrands}
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aabha-card overflow-hidden p-8">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                {t.home.paletteTitle} · {theme?.key ?? 'fallback'}
              </p>
              <div className="grid grid-cols-4 gap-3">
                {PALETTE_KEYS.map((key) => (
                  <div key={key} className="text-center">
                    <div
                      className="mx-auto h-14 w-full rounded-md border border-line"
                      style={{ backgroundColor: token(key) }}
                    />
                    <p className="mt-1.5 truncate text-[10px] text-ink-subtle" title={key}>
                      {key.replace('color.', '')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Segment accents: distinct but non-clashing. */}
              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                {SEGMENTS.map((segment) => (
                  <div
                    key={segment.key}
                    data-segment={segment.key}
                    className="rounded-md border border-line bg-primary-soft p-3"
                  >
                    <span className="mb-1.5 block h-1.5 w-10 rounded-pill bg-primary" />
                    <p className="text-xs font-medium text-ink">
                      {pick(segment.labelEn, segment.labelBn)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="aabha-container grid gap-4 py-12 md:grid-cols-3">
        {trust.map((item) => (
          <div key={item.title} className="aabha-card flex items-start gap-3 p-5">
            <span className="rounded-md bg-primary-soft p-2 text-primary-strong">
              <item.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 text-xs text-ink-subtle">{item.body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Runtime theming callout */}
      <section className="aabha-container pb-8">
        <div className="aabha-card flex flex-col items-start gap-6 p-8 md:flex-row md:items-center">
          <span className="rounded-lg bg-accent-soft p-3 text-ink">
            <Palette className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h2 className="font-display text-2xl text-ink">{t.home.designSystemTitle}</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{t.home.designSystemBody}</p>
          </div>
          <Link href="/admin/theme">
            <Button variant="outline">
              {t.home.openAdmin}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Review section — the only place grey is allowed */}
      <section className="aabha-container pb-16">
        <div className="aabha-review-surface rounded-lg border p-8">
          <div className="mb-5 flex items-baseline justify-between">
            <h2
              className="font-display text-2xl"
              style={{ color: 'var(--aabha-color-review-ink)' }}
            >
              {pick('What customers say', 'ক্রেতারা যা বলেন')}
            </h2>
            <p className="text-xs">{t.home.reviewsNote}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                en: 'Ordered a serum on Sunday, delivered in Chattogram by Tuesday. Sealed and authentic.',
                bn: 'রবিবার সিরাম অর্ডার করেছি, মঙ্গলবার চট্টগ্রামে পেয়েছি। সিল করা ও অরিজিনাল।',
                name: 'Farhana R.',
              },
              {
                en: 'The Bangla product descriptions made it so much easier to pick the right sunscreen.',
                bn: 'বাংলায় বর্ণনা থাকায় সঠিক সানস্ক্রিন বেছে নিতে অনেক সুবিধা হয়েছে।',
                name: 'Tanvir A.',
              },
              {
                en: 'Cash on delivery plus a WhatsApp confirmation call — felt safe the whole way.',
                bn: 'ক্যাশ অন ডেলিভারি ও হোয়াটসঅ্যাপ কনফার্মেশন কল — পুরো সময় নিরাপদ লেগেছে।',
                name: 'Sumaiya K.',
              },
            ].map((review) => (
              <figure
                key={review.name}
                className="rounded-md border p-4"
                style={{
                  borderColor: 'var(--aabha-color-review-border)',
                  backgroundColor: 'var(--aabha-color-surface)',
                }}
              >
                <div
                  className="mb-2 text-sm"
                  style={{ color: 'var(--aabha-color-review-star)' }}
                  aria-label="5 out of 5 stars"
                >
                  ★★★★★
                </div>
                <blockquote className="text-sm" style={{ color: 'var(--aabha-color-review-ink)' }}>
                  {pick(review.en, review.bn)}
                </blockquote>
                <figcaption
                  className="mt-3 text-xs"
                  style={{ color: 'var(--aabha-color-review-ink)' }}
                >
                  {review.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
