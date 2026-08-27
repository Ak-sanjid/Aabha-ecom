'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, KeyRound, Mail, Phone, ShieldCheck, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n/i18n-provider';
import { ApiError, authApi, type AuthResult, type IdentifyResult } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useToastStore } from '@/store/toast-store';

type Step = 'IDENTIFY' | 'PASSWORD' | 'OTP' | 'REGISTER' | 'FORGOT';

/**
 * The unified login/register bar.
 *
 * A single input accepts an email or a Bangladeshi mobile number. The backend
 * decides what comes next — password, one-time code, or full registration —
 * and this component swaps the fields in place without ever losing what the
 * customer already typed.
 */
export function AuthForm() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const pushToast = useToastStore((s) => s.push);

  const [step, setStep] = useState<Step>('IDENTIFY');
  const [identifier, setIdentifier] = useState('');
  const [identity, setIdentity] = useState<IdentifyResult | null>(null);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepFieldRef = useRef<HTMLInputElement>(null);

  // Move focus to the newly revealed field each time the form swaps step, so
  // keyboard and screen-reader users are not left behind by the transition.
  useEffect(() => {
    if (step !== 'IDENTIFY') stepFieldRef.current?.focus();
  }, [step]);

  const finish = (result: AuthResult) => {
    setUser(result.user);
    if (result.notice) {
      pushToast({
        kind: result.notice.kind === 'GUEST_ACCOUNT_CREATED' ? 'success' : 'info',
        title: locale === 'bn' ? result.notice.messageBn : result.notice.messageEn,
        duration: 8000,
      });
    } else {
      pushToast({
        kind: 'success',
        title: `${t.auth.signedInAs} ${result.user.fullName ?? result.user.email ?? result.user.phone}`,
      });
    }
    router.push(result.user.role === 'CUSTOMER' ? '/' : '/admin');
    router.refresh();
  };

  const handleError = (err: unknown) => {
    setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
  };

  const onIdentify = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await authApi.identify(identifier);
      setIdentity(result);
      if (result.nextStep === 'INVALID') {
        setError(t.auth.invalidIdentifier);
        return;
      }
      if (result.nextStep === 'OTP') {
        const otpResult = await authApi.requestOtp(result.normalized);
        setDevCode(otpResult.devCode ?? null);
      }
      setStep(result.nextStep as Step);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const onPassword = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      finish(await authApi.login(identity?.normalized ?? identifier, password));
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      finish(
        await authApi.register({
          identifier: identity?.normalized ?? identifier,
          fullName,
          password,
          locale: locale === 'bn' ? 'BN' : 'EN',
        }),
      );
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const onVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      finish(
        await authApi.verifyOtp(identity?.normalized ?? identifier, otp, fullName || undefined),
      );
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const onForgot = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authApi.forgotPassword(identity?.normalized ?? identifier, 'EMAIL');
      pushToast({ kind: 'info', title: t.auth.resetSent });
      setStep('IDENTIFY');
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setBusy(true);
    try {
      const result = await authApi.requestOtp(identity?.normalized ?? identifier);
      setDevCode(result.devCode ?? null);
      pushToast({
        kind: 'info',
        title: `${t.auth.otpSentTo} ${identity?.normalized ?? identifier}`,
      });
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setStep('IDENTIFY');
    setIdentity(null);
    setPassword('');
    setOtp('');
    setDevCode(null);
    setError(null);
  };

  return (
    <div className="aabha-card w-full max-w-md p-7">
      <h1 className="font-display text-2xl text-ink">{t.auth.title}</h1>
      <p className="mt-1 text-sm text-ink-subtle">
        {step === 'IDENTIFY'
          ? t.auth.subtitle
          : identity?.exists
            ? t.auth.welcomeBack
            : t.auth.newHere}
      </p>

      {step !== 'IDENTIFY' && (
        <div className="mt-4 flex items-center justify-between rounded-md bg-surface-muted px-3 py-2">
          <span className="flex items-center gap-2 text-sm text-ink">
            {identity?.identifierKind === 'phone' ? (
              <Phone className="h-4 w-4 text-ink-subtle" />
            ) : (
              <Mail className="h-4 w-4 text-ink-subtle" />
            )}
            {identity?.normalized ?? identifier}
          </span>
          <button
            type="button"
            onClick={reset}
            className="text-xs font-medium text-primary-strong hover:underline"
          >
            {t.common.back}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="bg-danger/10 mt-4 rounded-md px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {step === 'IDENTIFY' && (
        <form onSubmit={onIdentify} className="mt-5 space-y-4">
          <Input
            name="identifier"
            label={t.auth.identifierLabel}
            placeholder={t.auth.identifierPlaceholder}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
            leading={<Smartphone className="h-4 w-4" />}
          />
          <Button type="submit" fullWidth loading={busy} size="lg">
            {t.auth.continueWith}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      {step === 'PASSWORD' && (
        <form onSubmit={onPassword} className="mt-5 space-y-4">
          <Input
            name="password"
            type="password"
            label={t.auth.passwordLabel}
            placeholder={t.auth.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            ref={stepFieldRef}
            required
            leading={<KeyRound className="h-4 w-4" />}
          />
          <Button type="submit" fullWidth loading={busy} size="lg">
            {t.common.signIn}
          </Button>
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setStep('FORGOT')}
              className="text-ink-subtle hover:text-primary-strong"
            >
              {t.auth.forgotPassword}
            </button>
            {identity?.identifierKind === 'phone' && (
              <button
                type="button"
                onClick={async () => {
                  await resendOtp();
                  setStep('OTP');
                }}
                className="text-ink-subtle hover:text-primary-strong"
              >
                {t.auth.useOtpInstead}
              </button>
            )}
          </div>
        </form>
      )}

      {step === 'OTP' && (
        <form onSubmit={onVerifyOtp} className="mt-5 space-y-4">
          {!identity?.exists && (
            <Input
              name="fullName"
              label={t.auth.nameLabel}
              placeholder={t.auth.namePlaceholder}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          )}
          <Input
            name="otp"
            label={t.auth.otpLabel}
            placeholder={t.auth.otpPlaceholder}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            maxLength={8}
            ref={stepFieldRef}
            required
            leading={<ShieldCheck className="h-4 w-4" />}
            hint={devCode ? `Dev mode — your code is ${devCode}` : undefined}
          />
          <Button type="submit" fullWidth loading={busy} size="lg">
            {t.auth.continueWith}
          </Button>
          <button
            type="button"
            onClick={resendOtp}
            className="w-full text-center text-xs text-ink-subtle hover:text-primary-strong"
          >
            {t.auth.resendOtp}
          </button>
        </form>
      )}

      {step === 'REGISTER' && (
        <form onSubmit={onRegister} className="mt-5 space-y-4">
          <Input
            name="fullName"
            label={t.auth.nameLabel}
            placeholder={t.auth.namePlaceholder}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            ref={stepFieldRef}
            required
          />
          <Input
            name="password"
            type="password"
            label={t.auth.passwordLabel}
            placeholder={t.auth.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
            leading={<KeyRound className="h-4 w-4" />}
          />
          <Button type="submit" fullWidth loading={busy} size="lg">
            {t.auth.continueWith}
          </Button>
        </form>
      )}

      {step === 'FORGOT' && (
        <form onSubmit={onForgot} className="mt-5 space-y-4">
          <p className="text-sm text-ink-soft">{t.auth.resetVia}</p>
          <div className="flex gap-2">
            <Button type="submit" loading={busy} fullWidth>
              {t.auth.email}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await authApi.forgotPassword(identity?.normalized ?? identifier, 'WHATSAPP');
                  pushToast({ kind: 'info', title: t.auth.resetSent });
                  setStep('IDENTIFY');
                } catch (err) {
                  handleError(err);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t.auth.whatsapp}
            </Button>
          </div>
        </form>
      )}

      {/* Social sign-in */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] uppercase tracking-widest text-ink-subtle">
            {t.auth.orContinueWith}
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <a href="/api/auth/google" className="contents">
            <Button variant="outline" fullWidth type="button">
              {t.auth.google}
            </Button>
          </a>
          <a href="/api/auth/facebook" className="contents">
            <Button variant="outline" fullWidth type="button">
              {t.auth.facebook}
            </Button>
          </a>
        </div>
        <p className="mt-4 text-center text-xs text-ink-subtle">
          <Link href="/shop" className="hover:text-primary-strong">
            {t.auth.guestCheckout}
          </Link>
        </p>
      </div>
    </div>
  );
}
