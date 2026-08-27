'use client';

import { create } from 'zustand';

export type ToastKind = 'success' | 'info' | 'warning' | 'danger';

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  /** Milliseconds before auto-dismiss; 0 keeps it until dismissed. */
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => string;
  dismiss: (id: string) => void;
}

/**
 * Floating auto-dismissing notifications — used for the guest-checkout
 * "we created an account for you" message, theme publishes, etc.
 */
export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  push: ({ duration = 6000, ...toast }) => {
    const id = Math.random().toString(36).slice(2, 10);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id, duration }] }));
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration);
    }
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
