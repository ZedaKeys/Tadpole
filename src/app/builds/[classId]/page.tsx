1|import { classes } from '@/data/classes';

export const metadata = { title: 'Build Details — Tadpole' };
import ClassDetailClientPage from './ClientPage';

export function generateStaticParams() {
  return classes.map((c) => ({ classId: c.id }));
}

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  return <ClassDetailClientPage params={{ classId }} />;
}
