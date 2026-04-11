'use client';

import { Shield, Swords, Wand2, Heart } from 'lucide-react';
import { classes } from '@/data/classes';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { AppShell } from '@/components/layout/AppShell';

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
      <p
        className="mb-3"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
      >
        {classes.length} class{classes.length !== 1 ? 'es' : ''}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {classes.map((cls) => (
          <Card
            key={cls.id}
            title={cls.name}
            href={`/builds/${cls.id}`}
            description={`${cls.description.slice(0, 70)}...`}
            icon={
              <div className="flex flex-wrap gap-1.5">
                <Badge label={cls.hitDie} color={CLASS_COLORS[cls.id] ?? 'var(--accent)'} />
                <Badge label={cls.primaryAbility} color="#6366f1" />
              </div>
            }
          />
        ))}
      </div>
    </AppShell>
  );
}
