import { areas } from '@/data/areas';

import AreaDetailClientPage from './ClientPage';

export const metadata = { title: 'Areas — Tadpole' };

export function generateStaticParams() {
  return areas.map((a) => ({ areaId: a.id }));
}

export default async function AreaDetailPage({ params }: { params: Promise<{ areaId: string }> }) {
  const { areaId } = await params;
  return <AreaDetailClientPage params={{ areaId }} />;
}
