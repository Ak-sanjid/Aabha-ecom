'use client';

import { useI18n } from '@/i18n/i18n-provider';

export default function AdminOrdersPage() {
  const { t, pick } = useI18n();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-ink">{t.admin.orders}</h1>
      <div className="aabha-card p-10 text-center">
        <p className="font-display text-xl text-ink">
          {pick(
            'Order management arrives in Milestone 3.',
            'অর্ডার ব্যবস্থাপনা মাইলস্টোন ৩-এ আসছে।',
          )}
        </p>
        <p className="mt-2 text-sm text-ink-subtle">
          {pick(
            'The status state machine, courier adapters and COD verification are next.',
            'অর্ডার স্ট্যাটাস স্টেট মেশিন, কুরিয়ার অ্যাডাপ্টার ও সিওডি যাচাই পরবর্তী ধাপে।',
          )}
        </p>
      </div>
    </div>
  );
}
