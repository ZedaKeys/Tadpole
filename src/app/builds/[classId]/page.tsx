'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Shield, Swords, Target } from 'lucide-react';
import { classes } from '@/data/classes';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Accordion';
import { AppShell } from '@/components/layout/AppShell';
import type { GameClass, ClassFeature, Subclass } from '@/types';

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

function FeatureRow({ feature }: { feature: ClassFeature }) {
  return (
    <div
      className="py-3"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Badge label={`Lv ${feature.level}`} color="var(--accent)" />
        <span
          className="font-semibold text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {feature.name}
        </span>
      </div>
      <p
        className="text-xs leading-relaxed"
        style={{ color: 'var(--text-secondary)', marginTop: 4 }}
      >
        {feature.description}
      </p>
    </div>
  );
}

function SubclassSection({ subclass, classColor }: { subclass: Subclass; classColor: string }) {
  return (
    <Accordion title={subclass.name}>
      <p
        className="text-sm leading-relaxed mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        {subclass.description}
      </p>
      <div className="space-y-0">
        {subclass.features.map((feature, i) => (
          <FeatureRow key={i} feature={feature} />
        ))}
      </div>
    </Accordion>
  );
}

export default function ClassDetailPage() {
  const params = useParams<{ classId: string }>();
  const router = useRouter();
  const cls: GameClass | undefined = classes.find((c) => c.id === params.classId);

  if (!cls) {
    return (
      <AppShell title="Class Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Class not found.
          </p>
          <button
            onClick={() => router.push('/builds')}
            className="touch-target mt-4 rounded-lg px-6 py-3 font-medium"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
            }}
          >
            Back to Classes
          </button>
        </div>
      </AppShell>
    );
  }

  const classColor = CLASS_COLORS[cls.id] ?? 'var(--accent)';

  // Group features by level
  const featuresByLevel = cls.features.reduce<Record<number, ClassFeature[]>>((acc, feature) => {
    if (!acc[feature.level]) acc[feature.level] = [];
    acc[feature.level].push(feature);
    return acc;
  }, {});

  const sortedLevels = Object.keys(featuresByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <AppShell title={cls.name}>
      {/* Back button */}
      <button
        onClick={() => router.push('/builds')}
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
        <span>Back to Classes</span>
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge label={cls.hitDie} color={classColor} />
          <Badge label={cls.primaryAbility} color="#6366f1" />
        </div>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          {cls.name}
        </h2>
        <p
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            lineHeight: 1.7,
          }}
        >
          {cls.description}
        </p>
      </div>

      {/* Stats grid */}
      <div
        className="rounded-xl p-4 mb-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Heart size={14} style={{ color: 'var(--danger)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                Hit Die
              </span>
            </div>
            <span className="font-mono-num font-semibold" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              {cls.hitDie}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Target size={14} style={{ color: classColor }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                Primary Ability
              </span>
            </div>
            <span className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              {cls.primaryAbility}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Shield size={14} style={{ color: '#3b82f6' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                Saving Throws
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {cls.savingThrows.map((st) => (
                <Badge key={st} label={st} color="#3b82f6" />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Swords size={14} style={{ color: '#f59e0b' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                Weapon Prof.
              </span>
            </div>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem', lineHeight: 1.4 }}>
              {cls.weaponProficiencies.join(', ')}
            </span>
          </div>
        </div>

        {cls.armorProficiencies.length > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Shield size={14} style={{ color: '#22c55e' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                Armor Proficiencies
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {cls.armorProficiencies.map((prof) => (
                <Badge key={prof} label={prof} color="#22c55e" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Features grouped by level */}
      <div className="mb-5">
        <h3
          className="font-semibold text-sm mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          Class Features
        </h3>
        {sortedLevels.map((level) => (
          <div key={level} className="mb-3">
            <div
              className="flex items-center gap-2 mb-2"
              style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Level {level}
            </div>
            {featuresByLevel[level].map((feature, i) => (
              <FeatureRow key={i} feature={feature} />
            ))}
          </div>
        ))}
      </div>

      {/* Subclasses */}
      {cls.subclasses.length > 0 && (
        <div className="mb-5">
          <h3
            className="font-semibold text-sm mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            Subclasses
          </h3>
          <div className="space-y-2">
            {cls.subclasses.map((subclass) => (
              <SubclassSection
                key={subclass.id}
                subclass={subclass}
                classColor={classColor}
              />
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
