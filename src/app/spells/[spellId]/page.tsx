'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Target, Layers, Timer, Shield, Zap, BookOpen } from 'lucide-react';
import { spells } from '@/data/spells';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Accordion';
import { AppShell } from '@/components/layout/AppShell';
import type { Spell } from '@/types';

const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: '#4fc3f7',
  Conjuration: '#ab47bc',
  Divination: '#fdd835',
  Enchantment: '#ec407a',
  Evocation: '#ff7043',
  Illusion: '#7e57c2',
  Necromancy: '#78909c',
  Transmutation: '#66bb6a',
};

function levelLabel(level: number): string {
  if (level === 0) return 'Cantrip';
  return `Level ${level}`;
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <Icon size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1">
        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function SpellDetailPage() {
  const params = useParams<{ spellId: string }>();
  const router = useRouter();
  const spell: Spell | undefined = spells.find((s) => s.id === params.spellId);

  if (!spell) {
    return (
      <AppShell title="Spell Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Spell not found.
          </p>
          <button
            onClick={() => router.push('/spells')}
            className="touch-target mt-4 rounded-lg px-6 py-3 font-medium"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
            }}
          >
            Back to Spells
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={spell.name}>
      {/* Back button */}
      <button
        onClick={() => router.push('/spells')}
        className="touch-target flex items-center gap-1 mb-4 rounded-lg"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--accent)',
          fontSize: '0.875rem',
          padding: 0,
          minHeight: 44,
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Spells</span>
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge label={spell.school} color={SCHOOL_COLORS[spell.school]} />
          <Badge label={levelLabel(spell.level)} color="var(--accent)" />
          {spell.concentration && <Badge label="Concentration" color="#f59e0b" />}
          {spell.ritual && <Badge label="Ritual" color="#8b5cf6" />}
        </div>
        <h2
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {spell.name}
        </h2>
      </div>

      {/* Detail rows */}
      <div className="mb-5" style={{ background: 'var(--surface)', borderRadius: 12, padding: '4px 16px', border: '1px solid var(--border)' }}>
        <DetailRow icon={Clock} label="Casting Time" value={spell.castingTime} />
        <DetailRow icon={Target} label="Range" value={spell.range} />
        <DetailRow icon={Layers} label="Components" value={spell.components} />
        <DetailRow icon={Timer} label="Duration" value={spell.duration} />
        {spell.damage && (
          <DetailRow
            icon={Zap}
            label="Damage"
            value={`${spell.damage.dice} ${spell.damage.type}`}
          />
        )}
        {spell.saves && spell.saves.length > 0 && (
          <DetailRow
            icon={Shield}
            label="Saving Throw"
            value={spell.saves.map((s) => `${s.ability} (${s.effect})`).join(', ')}
          />
        )}
      </div>

      {/* Description */}
      <div className="mb-5">
        <h3
          className="font-semibold text-sm mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <BookOpen size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Description
        </h3>
        <p
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            lineHeight: 1.7,
          }}
        >
          {spell.description}
        </p>
      </div>

      {/* Accordion sections */}
      {spell.higherLevels && (
        <div className="mb-3">
          <Accordion title="At Higher Levels">
            <p style={{ lineHeight: 1.6 }}>{spell.higherLevels}</p>
          </Accordion>
        </div>
      )}

      <div className="mb-3">
        <Accordion title={`Classes (${spell.classes.length})`}>
          <div className="flex flex-wrap gap-2">
            {spell.classes.map((cls) => (
              <Badge key={cls} label={cls} color="var(--accent)" />
            ))}
          </div>
        </Accordion>
      </div>
    </AppShell>
  );
}
