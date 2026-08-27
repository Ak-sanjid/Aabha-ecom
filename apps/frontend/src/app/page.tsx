import type { Metadata } from 'next';
import { HomeView } from '@/components/home/home-view';

export const metadata: Metadata = {
  title: 'Aabha — Beauty & Personal Care in Bangladesh',
  description:
    'Authentic skincare, makeup, haircare and grooming essentials delivered nationwide with cash on delivery.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <HomeView />;
}
