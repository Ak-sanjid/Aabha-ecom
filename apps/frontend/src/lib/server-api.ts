/**
 * Server-side API client.
 *
 * Runs only in Server Components / route handlers, talking to the backend over
 * the internal network. Browser code must use `@/lib/api-client` instead, which
 * calls the same-origin `/api/*` proxy.
 */
const API_ORIGIN = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:4000';
const API_BASE = `${API_ORIGIN}/api/v1`;

export interface ThemePayload {
  key: string;
  name: string;
  publishedAt: string | null;
  tokens: Record<string, string>;
  segments: Record<string, Record<string, string>>;
  raw: Array<{
    key: string;
    type: string;
    group: string;
    value: string;
    segmentValues?: Record<string, string> | null;
  }>;
}

export interface NavNode {
  id: string;
  labelEn: string;
  labelBn: string;
  href: string;
  badgeText: string | null;
  iconKey: string | null;
  imageUrl: string | null;
  groupKey: string | null;
  segment: string;
  position: number;
  children: NavNode[];
}

export type NavigationPayload = Partial<
  Record<
    | 'HEADER_PRIMARY'
    | 'HEADER_SECONDARY'
    | 'TOP_CATEGORY_BAR'
    | 'SIDE_CATEGORY_PANEL'
    | 'MEGA_CATEGORY'
    | 'MEGA_BRAND'
    | 'FOOTER'
    | 'MOBILE_DRAWER',
    NavNode[]
  >
>;

async function serverFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
      // Theme/navigation change from the admin panel at runtime, so keep the
      // window short rather than caching indefinitely.
      next: { revalidate: 30 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    // The storefront must still render if the API is briefly unavailable.
    return null;
  }
}

export const serverApi = {
  getTheme: () => serverFetch<ThemePayload>('/theme'),
  getNavigation: () => serverFetch<NavigationPayload>('/navigation'),
  getBrands: () =>
    serverFetch<{ items: Array<{ id: string; slug: string; name: string }> }>(
      '/catalog/brands?pageSize=100',
    ),
};

export { API_BASE, API_ORIGIN };
