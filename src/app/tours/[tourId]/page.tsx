1|import { tours } from '@/data/tours';

export const metadata = { title: 'Tour — Tadpole' };
import TourDetailClientPage from './ClientPage';

export function generateStaticParams() {
  return tours.map((t) => ({ tourId: t.id }));
}

export default async function TourDetailPage({ params }: { params: Promise<{ tourId: string }> }) {
  const { tourId } = await params;
  return <TourDetailClientPage params={{ tourId }} />;
}
