1|import { companions } from '@/data/companions';

export const metadata = { title: 'Companion — Tadpole' };
import CompanionDetailClientPage from './ClientPage';

export function generateStaticParams() {
  return companions.map((c) => ({ companionId: c.id }));
}

export default async function CompanionDetailPage({ params }: { params: Promise<{ companionId: string }> }) {
  const { companionId } = await params;
  return <CompanionDetailClientPage params={{ companionId }} />;
}
