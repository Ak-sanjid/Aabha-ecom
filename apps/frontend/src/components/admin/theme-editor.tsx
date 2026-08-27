'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Eye, RotateCcw, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api-client';
import { useToastStore } from '@/store/toast-store';
import { tokenToCssVar } from '@/theme/tokens';

interface AdminThemeSetting {
  id: string;
  key: string;
  type: string;
  group: string;
  label: string;
  description: string | null;
  value: string;
  draftValue: string | null;
  segmentValues: Record<string, string> | null;
  position: number;
}

interface AdminThemeResponse {
  theme: { id: string; key: string; name: string; publishedAt: string | null };
  pendingChanges: number;
  groups: Array<{ group: string; items: AdminThemeSetting[] }>;
}

const GROUP_LABELS: Record<string, { en: string; bn: string }> = {
  surface: { en: 'Surfaces', bn: 'সারফেস' },
  text: { en: 'Ink & text', bn: 'টেক্সট' },
  brand: { en: 'Brand accents', bn: 'ব্র্যান্ড অ্যাকসেন্ট' },
  status: { en: 'Status colours', bn: 'স্ট্যাটাস রঙ' },
  reviews: { en: 'Reviews (grey only)', bn: 'রিভিউ (শুধু ধূসর)' },
  typography: { en: 'Typography', bn: 'টাইপোগ্রাফি' },
  shape: { en: 'Shape & elevation', bn: 'শেপ ও শ্যাডো' },
  identity: { en: 'Brand identity', bn: 'ব্র্যান্ড পরিচয়' },
  features: { en: 'Feature flags', bn: 'ফিচার ফ্ল্যাগ' },
};

/**
 * Theme editor.
 *
 * Edits are staged locally, saved to the server as drafts, and only affect the
 * live storefront when "Publish / Go Live" is pressed. A live preview applies
 * the pending values to this page's CSS variables so the admin sees the result
 * before publishing.
 */
export function ThemeEditor() {
  const { t, locale, pick } = useI18n();
  const pushToast = useToastStore((s) => s.push);
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'theme'],
    queryFn: () => api.get<AdminThemeResponse>('/admin/theme'),
  });

  // Live preview: push pending values straight onto the document.
  useEffect(() => {
    if (!data) return;
    const root = document.documentElement;
    const touched: string[] = [];
    for (const group of data.groups) {
      for (const item of group.items) {
        const pending = edits[item.key] ?? item.draftValue;
        if (!preview || !pending) continue;
        const cssVar = tokenToCssVar(item.key);
        root.style.setProperty(cssVar, pending);
        touched.push(cssVar);
      }
    }
    return () => {
      touched.forEach((cssVar) => root.style.removeProperty(cssVar));
    };
  }, [data, edits, preview]);

  const saveDraft = useMutation({
    mutationFn: (tokens: Array<{ key: string; value: string }>) =>
      api.post<{ saved: number }>('/admin/theme/draft', { tokens }),
    onSuccess: (result) => {
      pushToast({ kind: 'success', title: `${t.admin.draftSaved} (${result.saved})` });
      setEdits({});
      void queryClient.invalidateQueries({ queryKey: ['admin', 'theme'] });
    },
    onError: () => pushToast({ kind: 'danger', title: 'Could not save the draft' }),
  });

  const publish = useMutation({
    mutationFn: () => api.post<{ published: number }>('/admin/theme/publish'),
    onSuccess: (result) => {
      pushToast({
        kind: 'success',
        title: t.admin.published,
        body: `${result.published} token(s)`,
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'theme'] });
      // Refresh the server-rendered stylesheet.
      setTimeout(() => window.location.reload(), 900);
    },
    onError: () => pushToast({ kind: 'danger', title: 'Publish failed' }),
  });

  const discard = useMutation({
    mutationFn: () => api.post<{ discarded: boolean }>('/admin/theme/discard'),
    onSuccess: () => {
      setEdits({});
      pushToast({ kind: 'info', title: t.admin.discard });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'theme'] });
    },
  });

  const pendingCount = useMemo(() => {
    const serverPending = data?.pendingChanges ?? 0;
    return serverPending + Object.keys(edits).length;
  }, [data, edits]);

  if (isLoading || !data) {
    return <p className="text-sm text-ink-subtle">{t.common.loading}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">{t.admin.theme}</h1>
          <p className="mt-1 text-sm text-ink-subtle">
            {pick(
              'Stored in the database and applied at runtime — no rebuild, no redeploy.',
              'ডেটাবেজে সংরক্ষিত ও রানটাইমে প্রযোজ্য — রিবিল্ড বা রিডিপ্লয় ছাড়াই।',
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3 py-2 text-xs text-ink-soft hover:border-primary"
          >
            <Eye className="h-3.5 w-3.5" />
            {t.admin.livePreview}: {preview ? 'on' : 'off'}
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => discard.mutate()}
            loading={discard.isPending}
            disabled={pendingCount === 0}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t.admin.discard}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={Object.keys(edits).length === 0}
            loading={saveDraft.isPending}
            onClick={() =>
              saveDraft.mutate(Object.entries(edits).map(([key, value]) => ({ key, value })))
            }
          >
            <Save className="h-3.5 w-3.5" />
            {t.common.save}
          </Button>
          <Button
            size="sm"
            onClick={() => publish.mutate()}
            loading={publish.isPending}
            disabled={pendingCount === 0}
          >
            <Upload className="h-3.5 w-3.5" />
            {t.admin.publish}
          </Button>
        </div>
      </div>

      {pendingCount > 0 && (
        <p className="bg-warning/10 rounded-md px-3 py-2 text-sm text-warning">
          {pendingCount} {t.admin.pendingChanges}
        </p>
      )}

      <div className="space-y-6">
        {data.groups.map((group) => (
          <section key={group.group} className="aabha-card p-6">
            <h2 className="mb-4 font-display text-xl text-ink">
              {GROUP_LABELS[group.group]
                ? locale === 'bn'
                  ? GROUP_LABELS[group.group]!.bn
                  : GROUP_LABELS[group.group]!.en
                : group.group}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => {
                const current = edits[item.key] ?? item.draftValue ?? item.value;
                const dirty = current !== item.value;
                return (
                  <div key={item.id} className="rounded-md border border-line p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{item.label}</p>
                        <p className="truncate text-[11px] text-ink-subtle" title={item.key}>
                          {item.key}
                        </p>
                      </div>
                      {dirty && (
                        <span className="bg-warning/15 shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-medium text-warning">
                          draft
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.type === 'COLOR' && (
                        <input
                          type="color"
                          aria-label={`${item.label} colour`}
                          value={/^#[0-9a-f]{6}$/i.test(current) ? current : '#ffffff'}
                          onChange={(e) =>
                            setEdits((prev) => ({ ...prev, [item.key]: e.target.value }))
                          }
                          className="h-9 w-10 shrink-0 cursor-pointer rounded-sm border border-line bg-transparent"
                        />
                      )}
                      <input
                        type="text"
                        value={current}
                        onChange={(e) =>
                          setEdits((prev) => ({ ...prev, [item.key]: e.target.value }))
                        }
                        className="h-9 w-full rounded-sm border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-primary"
                      />
                    </div>

                    {item.segmentValues && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(item.segmentValues).map(([segment, value]) => (
                          <span
                            key={segment}
                            className="inline-flex items-center gap-1 rounded-pill border border-line px-2 py-0.5 text-[10px] text-ink-subtle"
                          >
                            <span
                              className="h-2 w-2 rounded-pill"
                              style={{ backgroundColor: value }}
                            />
                            {segment}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.description && (
                      <p className="mt-2 text-[11px] leading-snug text-ink-subtle">
                        {item.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
