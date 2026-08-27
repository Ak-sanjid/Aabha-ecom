'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, leading, trailing, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-subtle"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border bg-surface px-3 transition-colors',
          'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-soft',
          error ? 'border-danger' : 'border-line',
          className,
        )}
      >
        {leading && <span className="shrink-0 text-ink-subtle">{leading}</span>}
        <input
          ref={ref}
          id={inputId}
          className="placeholder:text-ink-subtle/70 h-11 w-full bg-transparent text-sm text-ink outline-none"
          aria-invalid={Boolean(error)}
          {...props}
        />
        {trailing && <span className="shrink-0">{trailing}</span>}
      </div>
      {(hint || error) && (
        <p className={cn('mt-1.5 text-xs', error ? 'text-danger' : 'text-ink-subtle')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
