import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata: Metadata = {
  title: 'Sign in or create your account',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="aabha-container flex min-h-[70vh] items-center justify-center py-14">
      <AuthForm />
    </div>
  );
}
