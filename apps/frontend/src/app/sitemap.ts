import type { MetadataRoute } from 'next';
import { serverApi } from '@/lib/server-api';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Auto-generated sitemap. Milestone 5 extends this with product and blog URLs;
 * category/brand routes already come from the live database.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [navigation, brands] = await Promise.all([
    serverApi.getNavigation(),
    serverApi.getBrands(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = ['', '/shop'].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (navigation?.TOP_CATEGORY_BAR ?? []).map(
    (item) => ({
      url: `${siteUrl}${item.href}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }),
  );

  const brandRoutes: MetadataRoute.Sitemap = (brands?.items ?? []).map((brand) => ({
    url: `${siteUrl}/brand/${brand.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...brandRoutes];
}
