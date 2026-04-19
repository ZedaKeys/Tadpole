import { tours } from '@/data/tours';
import TourDetailClientPage from './ClientPage';

export function generateStaticParams() {
  return tours.map((t) => ({ tourId: t.id }));
}

export default async function TourDetailPage({ params }: { params: Promise<{ tourId: string }> }) {
  const { tourId } = await params;
  return <TourDetailClientPage params={{ tourId }} />;
}
