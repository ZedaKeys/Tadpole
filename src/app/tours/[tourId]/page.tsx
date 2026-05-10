import { tours } from '@/data/tours';

import TourDetailClientPage from './ClientPage';

export const metadata = { title: 'Tour — Tadpole' };

export function generateStaticParams() {
  return tours.map((t) => ({ tourId: t.id }));
}

export default async function TourDetailPage({ params }: { params: Promise<{ tourId: string }> }) {
  const { tourId } = await params;
  return <TourDetailClientPage params={{ tourId }} />;
}
