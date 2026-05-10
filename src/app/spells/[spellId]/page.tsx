import { spells } from '@/data/spells';

import SpellDetailClientPage from './ClientPage';

export const metadata = { title: 'Spell — Tadpole' };

export function generateStaticParams() {
  return spells.map((s) => ({ spellId: s.id }));
}

export default async function SpellDetailPage({ params }: { params: Promise<{ spellId: string }> }) {
  const { spellId } = await params;
  return <SpellDetailClientPage params={{ spellId }} />;
}
