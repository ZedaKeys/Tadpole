'use client';


import { classes } from '@/data/classes';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';

const CLASS_COLORS: Record<string, string> = {
  barbarian: '#ef4444',
  bard: '#ec4899',
  cleric: '#fbbf24',
  druid: '#22c55e',
  fighter: '#6b7280',
  monk: '#8b5cf6',
  paladin: '#f59e0b',
  ranger: '#10b981',
  rogue: '#64748b',
  sorcerer: '#f97316',
  warlock: '#7c3aed',
  wizard: '#3b82f6',
};

export default function BuildsPage() {
  return (
    <AppShell title="Build Planner">
      {/* Quick actions */}
      <div className="flex gap-3 mb-4">
        <Link
          href="/builds/new"
          className="stagger-in flex-1 py-3 font-semibold text-sm text-center"
          style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-bright))', color: 'var(--bg)', borderRadius: 9999, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, letterSpacing: '0.02em', padding: '12px 24px', animationDelay: '0.05s' }}
        >
          + New Build
        </Link>
        <Link
          href="/builds/saved"
          className="stagger-in flex-1 py-3 font-semibold text-sm text-center"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--gold)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9999, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 24px', animationDelay: '0.1s' }}
        >
          Saved Builds
        </Link>
      </div>

      <Link
        href="/builds/presets"
        className="stagger-in mb-6"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
          border: '1px solid rgba(168,85,247,0.25)',
          borderRadius: 12,
          padding: '12px 16px',
          textDecoration: 'none',
          animationDelay: '0.15s',
          minHeight: 44,
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>⚔️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#a855f7' }}>Preset Meta Builds</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>8 curated builds for Honour Mode</div>
        </div>
      </Link>

      <p
        className="stagger-in mb-5"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', animationDelay: '0.15s' }}
      >
        {classes.length} class{classes.length !== 1 ? 'es' : ''}
      </p>

      <div className="grid grid-cols-2 gap-4">
        {classes.map((cls, i) => (
          <Card
            key={cls.id}
            title={cls.name}
            href={`/builds/${cls.id}`}
            description={cls.description}
            accentColor={CLASS_COLORS[cls.id]}
            delay={i * 0.05}
            icon={
              <div className="flex flex-wrap gap-2">
                <Badge label={cls.hitDie} color={CLASS_COLORS[cls.id] ?? 'var(--gold)'} />
                <Badge label={cls.primaryAbility} color="var(--gold)" />
              </div>
            }
          />
        ))}
      </div>
    </AppShell>
  );
}
