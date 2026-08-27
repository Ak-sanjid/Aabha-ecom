'use client';

import { useI18n } from '@/i18n/i18n-provider';

export default function AdminCatalogPage() {
  const { t, pick } = useI18n();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-ink">{t.admin.catalog}</h1>
      <div className="aabha-card p-10 text-center">
        <p className="font-display text-xl text-ink">
          {pick(
            'Catalog management arrives in Milestone 2.',
            'ক্যাটালগ ব্যবস্থাপনা মাইলস্টোন ২-এ আসছে।',
          )}
        </p>
        <p className="mt-2 text-sm text-ink-subtle">
          {pick(
            'Products, variants, media, per-locale copy and AI-assisted content generation.',
            'পণ্য, ভ্যারিয়েন্ট, মিডিয়া, দ্বিভাষিক কনটেন্ট ও এআই-সহায়ক কনটেন্ট তৈরি।',
          )}
        </p>
      </div>
    </div>
  );
}
