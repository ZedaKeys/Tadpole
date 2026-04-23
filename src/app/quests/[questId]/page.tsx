1|import { quests } from '@/data/quests';

export const metadata = { title: 'Quest — Tadpole' };
import QuestDetailClientPage from './ClientPage';

export function generateStaticParams() {
  return quests.map((q) => ({ questId: q.id }));
}

export default async function QuestDetailPage({ params }: { params: Promise<{ questId: string }> }) {
  const { questId } = await params;
  return <QuestDetailClientPage params={{ questId }} />;
}
