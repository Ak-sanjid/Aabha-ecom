import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, isLocale, type Locale } from '@/i18n/dictionaries';
import { serverApi } from '@/lib/server-api';
import { buildThemeStylesheet } from '@/theme/tokens';
import { Providers } from './providers';
import { SiteChrome } from '@/components/layout/site-chrome';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Aabha — Beauty & Personal Care in Bangladesh',
    template: '%s · Aabha',
  },
  description:
    'Shop 100% authentic skincare, makeup, haircare and grooming essentials with cash on delivery across Bangladesh.',
  openGraph: {
    type: 'website',
    siteName: 'Aabha',
    locale: 'en_BD',
    alternateLocale: 'bn_BD',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FDFBF7',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Theme + navigation are fetched server-side on every boot so admin changes
  // appear without a rebuild, and without a flash of unstyled content.
  const [theme, navigation, cookieStore] = await Promise.all([
    serverApi.getTheme(),
    serverApi.getNavigation(),
    cookies(),
  ]);

  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieLocale)
    ? cookieLocale
    : ((process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale | undefined) ?? 'en');

  return (
    <html lang={locale} data-locale={locale} suppressHydrationWarning>
      <head>
        {/* Runtime design tokens straight from the database. */}
        <style id="aabha-theme" dangerouslySetInnerHTML={{ __html: buildThemeStylesheet(theme) }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600&family=Hind+Siliguri:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <Providers theme={theme} locale={locale}>
          <SiteChrome navigation={navigation ?? {}}>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
