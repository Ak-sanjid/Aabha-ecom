'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/lib/api-client';

interface AuthStore {
  user: AuthUser | null;
  status: 'idle' | 'authenticated' | 'anonymous';
  setUser: (user: AuthUser | null) => void;
  clear: () => void;
}

/**
 * Session state for the UI only — the real credentials live in httpOnly
 * cookies set by the API, never in localStorage.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      status: 'idle',
      setUser: (user) => set({ user, status: user ? 'authenticated' : 'anonymous' }),
      clear: () => set({ user: null, status: 'anonymous' }),
    }),
    { name: 'aabha-auth-ui', partialize: (state) => ({ user: state.user }) },
  ),
);
