'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api-client';
import { useToastStore } from '@/store/toast-store';
import { cn } from '@/lib/utils';

interface MenuItemRow {
  id: string;
  location: string;
  parentId: string | null;
  labelEn: string;
  labelBn: string;
  href: string;
  badgeText: string | null;
  groupKey: string | null;
  segment: string;
  position: number;
  isVisible: boolean;
}

const LOCATIONS = [
  'HEADER_PRIMARY',
  'TOP_CATEGORY_BAR',
  'SIDE_CATEGORY_PANEL',
  'MEGA_CATEGORY',
  'MEGA_BRAND',
  'FOOTER',
] as const;

const LOCATION_LABELS: Record<string, string> = {
  HEADER_PRIMARY: 'Header utility links',
  TOP_CATEGORY_BAR: 'Top category bar',
  SIDE_CATEGORY_PANEL: 'Left category panel',
  MEGA_CATEGORY: 'Browse Category mega-menu',
  MEGA_BRAND: 'Brand mega-menu (A–Z)',
  FOOTER: 'Footer',
};

/** Reorder / show-hide / add navigation entries — all without a deploy. */
export function NavigationEditor() {
  const { t, pick } = useI18n();
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.push);
  const [activeLocation, setActiveLocation] = useState<string>('TOP_CATEGORY_BAR');
  const [draft, setDraft] = useState({ labelEn: '', labelBn: '', href: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'navigation'],
    queryFn: () => api.get<MenuItemRow[]>('/admin/navigation'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'navigation'] });

  const toggle = useMutation({
    mutationFn: (id: string) => api.post(`/admin/navigation/${id}/toggle`),
    onSuccess: () => {
      void invalidate();
      pushToast({ kind: 'info', title: pick('Visibility updated', 'দৃশ্যমানতা পরিবর্তিত') });
    },
  });

  const reorder = useMutation({
    mutationFn: (items: Array<{ id: string; position: number }>) =>
      api.post('/admin/navigation/reorder', { items }),
    onSuccess: () => void invalidate(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/navigation/${id}`),
    onSuccess: () => {
      void invalidate();
      pushToast({ kind: 'info', title: pick('Item removed', 'আইটেম মুছে ফেলা হয়েছে') });
    },
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/admin/navigation', {
        location: activeLocation,
        labelEn: draft.labelEn,
        labelBn: draft.labelBn || draft.labelEn,
        href: draft.href,
        position: rows.length,
      }),
    onSuccess: () => {
      setDraft({ labelEn: '', labelBn: '', href: '' });
      void invalidate();
      pushToast({ kind: 'success', title: pick('Item added', 'আইটেম যোগ হয়েছে') });
    },
    onError: () => pushToast({ kind: 'danger', title: 'Could not add the item' }),
  });

  const rows = (data ?? [])
    .filter((row) => row.location === activeLocation && !row.parentId)
    .sort((a, b) => a.position - b.position);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const current = next[index];
    const swap = next[target];
    if (!current || !swap) return;
    next[index] = swap;
    next[target] = current;
    reorder.mutate(next.map((row, i) => ({ id: row.id, position: i })));
  };

  if (isLoading) return <p className="text-sm text-ink-subtle">{t.common.loading}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">{t.admin.navigation}</h1>
        <p className="mt-1 text-sm text-ink-subtle">
          {pick(
            'Reorder, hide or add entries. The storefront picks changes up immediately.',
            'আইটেম সাজান, লুকান বা যোগ করুন। স্টোরফ্রন্টে সাথে সাথেই প্রতিফলিত হবে।',
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LOCATIONS.map((location) => (
          <button
            key={location}
            type="button"
            onClick={() => setActiveLocation(location)}
            className={cn(
              'rounded-pill border px-3 py-1.5 text-xs transition-colors',
              activeLocation === location
                ? 'border-primary bg-primary-soft font-medium text-ink'
                : 'border-line text-ink-soft hover:border-primary',
            )}
          >
            {LOCATION_LABELS[location]}
          </button>
        ))}
      </div>

      <div className="aabha-card divide-y divide-line">
        {rows.length === 0 && (
          <p className="p-6 text-sm text-ink-subtle">
            {pick('No items in this location yet.', 'এই অংশে এখনো কোনো আইটেম নেই।')}
          </p>
        )}
        {rows.map((row, index) => (
          <div key={row.id} className="flex items-center gap-3 p-3">
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
                className="rounded-sm p-0.5 text-ink-subtle hover:text-ink disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
                aria-label="Move down"
                className="rounded-sm p-0.5 text-ink-subtle hover:text-ink disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'truncate text-sm text-ink',
                  !row.isVisible && 'line-through opacity-60',
                )}
              >
                {row.labelEn} <span className="text-ink-subtle">· {row.labelBn}</span>
              </p>
              <p className="truncate text-xs text-ink-subtle">{row.href}</p>
            </div>

            {row.segment !== 'UNISEX' && (
              <span className="rounded-pill border border-line px-2 py-0.5 text-[10px] text-ink-subtle">
                {row.segment}
              </span>
            )}

            <button
              type="button"
              onClick={() => toggle.mutate(row.id)}
              className="rounded-sm p-1.5 text-ink-subtle hover:bg-surface-muted hover:text-ink"
              aria-label={row.isVisible ? t.admin.hidden : t.admin.visible}
            >
              {row.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => remove.mutate(row.id)}
              className="hover:bg-danger/10 rounded-sm p-1.5 text-ink-subtle hover:text-danger"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <form
        className="aabha-card grid gap-3 p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Input
          label="Label (EN)"
          value={draft.labelEn}
          onChange={(e) => setDraft((d) => ({ ...d, labelEn: e.target.value }))}
          required
        />
        <Input
          label="Label (BN)"
          value={draft.labelBn}
          onChange={(e) => setDraft((d) => ({ ...d, labelBn: e.target.value }))}
        />
        <Input
          label="Link"
          placeholder="/category/skincare"
          value={draft.href}
          onChange={(e) => setDraft((d) => ({ ...d, href: e.target.value }))}
          required
        />
        <Button type="submit" loading={create.isPending}>
          <Plus className="h-4 w-4" />
          {pick('Add', 'যোগ করুন')}
        </Button>
      </form>
    </div>
  );
}
