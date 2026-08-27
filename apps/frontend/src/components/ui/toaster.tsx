'use client';

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore, type ToastKind } from '@/store/toast-store';
import { cn } from '@/lib/utils';

const icons: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
};

const accents: Record<ToastKind, string> = {
  success: 'border-l-success',
  info: 'border-l-info',
  warning: 'border-l-warning',
  danger: 'border-l-danger',
};

/**
 * Floating auto-dismissing notification stack. Used, among other things, for
 * the guest-checkout account notice required by the brief.
 */
export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.kind];
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex animate-toast-in items-start gap-3 rounded-md border border-l-4 border-line bg-surface-elevated p-4 shadow-card',
              accents[toast.kind],
            )}
          >
            <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{toast.title}</p>
              {toast.body && <p className="mt-0.5 text-xs text-ink-subtle">{toast.body}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded-sm p-1 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
