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
  Wifi,
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
      {/* Header with gradient glow */}
      <div className="text-center mb-8">
        <div
          className="mb-4"
          style={{
            position: 'relative',
            display: 'inline-block',
          }}
        >
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{
              color: 'var(--accent)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {APP_NAME}
          </h1>
          {/* Purple glow behind title */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 200,
              height: 60,
              background: 'radial-gradient(ellipse, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
              filter: 'blur(8px)',
              pointerEvents: 'none',
            }}
          />
        </div>
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
            className="feature-card touch-target rounded-xl p-4 flex flex-col items-center text-center"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
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

      {/* Coming Soon: Connect to Game */}
      <div
        className="mt-6 rounded-xl p-4 flex items-center gap-4 opacity-60"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{
            width: 48,
            height: 48,
            background: 'var(--surface-active)',
          }}
        >
          <Wifi size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="font-semibold text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Connect to Game
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: 'var(--surface-active)',
                color: 'var(--text-muted)',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Coming Soon
            </span>
          </div>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Live sync your playthrough data
          </p>
        </div>
      </div>
    </main>
  );
}
