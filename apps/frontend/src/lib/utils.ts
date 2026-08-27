import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formats an integer amount in poisha as Bangladeshi Taka. */
export function formatTaka(minor: number, locale: 'en' | 'bn' = 'en'): string {
  const value = minor / 100;
  const formatted = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `৳${formatted}`;
}
