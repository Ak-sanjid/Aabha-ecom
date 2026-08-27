'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { authApi } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useToastStore } from '@/store/toast-store';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const pushToast = useToastStore((s) => s.push);

  useEffect(() => {
    const notice = params.get('notice');
    authApi
      .me()
      .then((user) => {
        setUser(user);
        if (notice === 'ACCOUNT_LINKED') {
          pushToast({
            kind: 'info',
            title: 'We linked your social sign-in to your existing Aabha account.',
          });
        }
        router.replace(user.role === 'CUSTOMER' ? '/' : '/admin');
      })
      .catch(() => router.replace('/login'));
  }, [params, router, setUser, pushToast]);

  return (
    <div className="aabha-container flex min-h-[50vh] items-center justify-center">
      <p className="text-sm text-ink-subtle">Finishing sign-in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
