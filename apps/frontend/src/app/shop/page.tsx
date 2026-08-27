import type { Metadata } from 'next';
import { serverApi } from '@/lib/server-api';
import { ShopView } from '@/components/shop/shop-view';

export const metadata: Metadata = {
  title: 'Shop all products',
  description:
    'Browse authentic beauty and personal care products by concern, skin type, brand and routine step.',
  alternates: { canonical: '/shop' },
};

export default async function ShopPage() {
  const navigation = await serverApi.getNavigation();
  return <ShopView sections={navigation?.SIDE_CATEGORY_PANEL ?? []} />;
}
