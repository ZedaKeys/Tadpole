1|import { spells } from '@/data/spells';

export const metadata = { title: 'Spell — Tadpole' };
import SpellDetailClientPage from './ClientPage';

export function generateStaticParams() {
  return spells.map((s) => ({ spellId: s.id }));
}

export default async function SpellDetailPage({ params }: { params: Promise<{ spellId: string }> }) {
  const { spellId } = await params;
  return <SpellDetailClientPage params={{ spellId }} />;
}
