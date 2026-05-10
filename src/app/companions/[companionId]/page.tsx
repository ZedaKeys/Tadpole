import { companions } from '@/data/companions';

import CompanionDetailClientPage from './ClientPage';

export const metadata = { title: 'Companion — Tadpole' };

export function generateStaticParams() {
  return companions.map((c) => ({ companionId: c.id }));
}

export default async function CompanionDetailPage({ params }: { params: Promise<{ companionId: string }> }) {
  const { companionId } = await params;
  return <CompanionDetailClientPage params={{ companionId }} />;
}
