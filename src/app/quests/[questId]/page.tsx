import { quests } from '@/data/quests';
import QuestDetailClientPage from './ClientPage';

export function generateStaticParams() {
  return quests.map((q) => ({ questId: q.id }));
}

export default async function QuestDetailPage({ params }: { params: Promise<{ questId: string }> }) {
  const { questId } = await params;
  return <QuestDetailClientPage params={{ questId }} />;
}
