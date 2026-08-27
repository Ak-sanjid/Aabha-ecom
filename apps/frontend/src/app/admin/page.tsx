'use client';

import Link from 'next/link';
import { ArrowRight, Menu as MenuIcon, Palette } from 'lucide-react';
import { useI18n } from '@/i18n/i18n-provider';
import { useTheme } from '@/theme/theme-provider';

export default function AdminDashboardPage() {
  const { t, pick } = useI18n();
  const { theme } = useTheme();

  const cards = [
    {
      href: '/admin/theme',
      icon: Palette,
      title: t.admin.theme,
      body: pick(
        'Edit colours, fonts and radii. Changes save as drafts until you publish.',
        'রঙ, ফন্ট ও রেডিয়াস পরিবর্তন করুন। পাবলিশ না করা পর্যন্ত ড্রাফট হিসেবে থাকবে।',
      ),
    },
    {
      href: '/admin/navigation',
      icon: MenuIcon,
      title: t.admin.navigation,
      body: pick(
        'Reorder, hide or add header, category-bar and mega-menu entries.',
        'হেডার, ক্যাটাগরি বার ও মেগা-মেনুর আইটেম সাজান, লুকান বা যোগ করুন।',
      ),
    },
  ];

  const stats = [
    { label: pick('Active theme', 'সক্রিয় থিম'), value: theme?.name ?? '—' },
    { label: pick('Design tokens', 'ডিজাইন টোকেন'), value: String(theme?.raw.length ?? 0) },
    {
      label: pick('Segment overrides', 'সেগমেন্ট ওভাররাইড'),
      value: String(Object.keys(theme?.segments ?? {}).length),
    },
    {
      label: pick('Last published', 'সর্বশেষ প্রকাশ'),
      value: theme?.publishedAt ? new Date(theme.publishedAt).toLocaleDateString() : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">{t.admin.dashboard}</h1>
        <p className="mt-1 text-sm text-ink-subtle">
          {pick(
            'Milestone 1 — foundation, theming and authentication are live.',
            'মাইলস্টোন ১ — ফাউন্ডেশন, থিমিং ও অথেনটিকেশন চালু।',
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="aabha-card p-5">
            <p className="text-xs uppercase tracking-wide text-ink-subtle">{stat.label}</p>
            <p className="mt-1.5 font-display text-2xl text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="aabha-card group block p-6">
            <span className="inline-flex rounded-md bg-primary-soft p-2 text-primary-strong">
              <card.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 flex items-center gap-1.5 font-display text-xl text-ink">
              {card.title}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </p>
            <p className="mt-1 text-sm text-ink-subtle">{card.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
