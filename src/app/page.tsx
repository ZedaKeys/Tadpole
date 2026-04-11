'use client';

import {
  Swords,
  BookOpen,
  Users,
  Map,
  Sparkles,
  Dice5,
  ScrollText,
  Compass,
  Gamepad2,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { APP_NAME, APP_TAGLINE, VERSION } from '@/lib/version';

const features = [
  { href: '/builds', icon: Swords, label: 'Build Planner', desc: 'Plan characters & classes' },
  { href: '/spells', icon: BookOpen, label: 'Spell Reference', desc: 'Browse & search all spells' },
  { href: '/companions', icon: Users, label: 'Companions', desc: 'Approval & romance guides' },
  { href: '/quests', icon: ScrollText, label: 'Quest Guide', desc: 'Decisions & consequences' },
  { href: '/items', icon: Sparkles, label: 'Item Database', desc: 'Notable gear & locations' },
  { href: '/areas', icon: Map, label: 'Areas', desc: 'Completion checklists' },
  { href: '/dice', icon: Dice5, label: 'Dice Calculator', desc: 'Probability & rolls' },
  { href: '/lore', icon: Compass, label: 'Lore Vault', desc: 'World history & factions' },
  { href: '/tours', icon: Compass, label: 'Guided Tours', desc: 'Curated playthroughs' },
  { href: '/games', icon: Gamepad2, label: 'Mini-Games', desc: 'Trivia & dice poker' },
  { href: '/settings', icon: Wrench, label: 'Settings', desc: 'Preferences & PWA' },
];

export default function HomePage() {
  return (
    <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-4xl font-bold tracking-tight mb-2"
          style={{ color: 'var(--accent)' }}
        >
          {APP_NAME}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          {APP_TAGLINE}
        </p>
        <p
          className="mt-1"
          style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
        >
          v{VERSION}
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-3">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="touch-target rounded-xl p-4 flex flex-col items-center text-center transition-colors"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'var(--surface-hover)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'var(--surface)')
            }
          >
            <f.icon size={28} style={{ color: 'var(--accent)' }} className="mb-2" />
            <span className="text-sm font-medium leading-tight">
              {f.label}
            </span>
            <span
              className="text-xs mt-1 leading-tight"
              style={{ color: 'var(--text-secondary)' }}
            >
              {f.desc}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
