'use client';


import { presetBuilds } from '@/data/preset-builds';
import { classes } from '@/data/classes';
import { races } from '@/data/races';
import { Badge } from '@/components/ui/Badge';
import { AppShell } from '@/components/layout/AppShell';
import { BackButton } from '@/components/ui/BackButton';
import { useState } from 'react';
import { saveBuild } from '@/lib/build-storage';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

const TAG_COLORS: Record<string, string> = {
  Melee: '#ef4444',
  Ranged: '#3b82f6',
  Caster: '#8b5cf6',
  Burst: '#f97316',
  Hybrid: '#ec4899',
  Support: '#22c55e',
  Stealth: '#64748b',
  Tank: '#eab308',
  Control: '#06b6d4',
  Fire: '#ef4444',
  Lightning: '#3b82f6',
  Throwing: '#f97316',
  Stun: '#8b5cf6',
  Mobile: '#10b981',
  Charisma: '#ec4899',
  Easy: '#22c55e',
  Fun: '#f59e0b',
  Meta: '#a855f7',
  Popular: '#f97316',
  AoE: '#ef4444',
};

export default function PresetsPage() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getClassName = (classId: string) =>
    classes.find(c => c.id === classId)?.name ?? classId;
  const getSubclassName = (classId: string, subclassId?: string) =>
    classes.find(c => c.id === classId)?.subclasses.find(s => s.id === subclassId)?.name ?? '';
  const getRaceName = (raceId: string) =>
    races.find(r => r.id === raceId)?.name ?? raceId;

  const handleSave = async (preset: typeof presetBuilds[number]) => {
    const build = {
      id: crypto.randomUUID(),
      name: preset.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      race: preset.race,
      subrace: preset.subrace,
      background: preset.background,
      baseScores: preset.baseScores,
      levels: preset.levels,
      featChoices: preset.featChoices,
      chosenSkills: preset.chosenSkills,
      chosenSpells: preset.chosenSpells,
    };
    await saveBuild(build);
    setSavedIds(prev => new Set(prev).add(preset.id));
  };

  // Count class levels
  const getClassSummary = (levels: typeof presetBuilds[number]['levels']) => {
    const counts: Record<string, number> = {};
    levels.forEach(l => {
      counts[l.classId] = (counts[l.classId] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([classId, count]) => `${getClassName(classId)} ${count}`)
      .join(' / ');
  };

  return (
    <AppShell title="Preset Builds">
      <BackButton href="/builds" />
      <p className="stagger-in mb-5" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        {presetBuilds.length} curated meta builds for Honour Mode and beyond
      </p>

      <div className="flex flex-col gap-4">
        {presetBuilds.map((preset, i) => {
          const isExpanded = expandedId === preset.id;
          const isSaved = savedIds.has(preset.id);

          return (
            <div
              key={preset.id}
              className="stagger-in"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 16,
                animationDelay: `${i * 0.06}s`,
              }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : preset.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold)', margin: 0 }}>
                      {preset.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                      {getRaceName(preset.race)} &middot; {getClassSummary(preset.levels)}
                    </p>
                  </div>
                  <Badge
                    label={preset.difficulty}
                    color={DIFFICULTY_COLORS[preset.difficulty] ?? 'var(--gold)'}
                  />
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                  {preset.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {preset.tags.map(tag => (
                    <Badge key={tag} label={tag} color={TAG_COLORS[tag] ?? 'var(--gold)'} />
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', opacity: 0.6 }}>
                  {isExpanded ? '▲ Collapse' : '▼ Details'}
                </span>
              </button>

              {isExpanded && (
                <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Background</span>
                      <p style={{ color: 'var(--text)', margin: '2px 0 8px', textTransform: 'capitalize' }}>
                        {preset.background.replace(/-/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Level Spread</span>
                      <p style={{ color: 'var(--text)', margin: '2px 0 8px' }}>
                        {getClassSummary(preset.levels)}
                      </p>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ability Scores (base)</span>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      {Object.entries(preset.baseScores).map(([ability, score]) => (
                        <div key={ability} style={{
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: 6,
                          padding: '4px 8px',
                          textAlign: 'center',
                          minWidth: 44,
                        }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            {ability.slice(0, 3)}
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--gold)' }}>{score}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {preset.featChoices.length > 0 && (
                    <div style={{ fontSize: '0.82rem', marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Key Feats</span>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        {preset.featChoices.map((fc, idx) => (
                          <Badge
                            key={idx}
                            label={fc.featId === 'ability-improvement' ? 'ASI' : fc.featId.replace(/-/g, ' ')}
                            color="var(--gold)"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleSave(preset)}
                    disabled={isSaved}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      borderRadius: 8,
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: isSaved ? 'default' : 'pointer',
                      background: isSaved ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, var(--gold), var(--gold-bright))',
                      color: isSaved ? '#22c55e' : 'var(--bg)',
                      minHeight: 44,
                      marginTop: 8,
                    }}
                  >
                    {isSaved ? '✓ Saved to My Builds' : 'Save to My Builds'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
