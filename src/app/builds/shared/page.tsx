1|'use client';

export const metadata = { title: 'Shared Builds — Tadpole' };

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BackButton } from '@/components/ui/BackButton';
import { Badge } from '@/components/ui/Badge';
import { decodeBuild } from '@/lib/build-share';
import { saveBuild } from '@/lib/build-storage';
import { races } from '@/data/races';
import { classes } from '@/data/classes';
import { backgrounds } from '@/data/backgrounds';
import { feats } from '@/data/feats';
import type { SavedBuild, AbilityType } from '@/types';

const ABILITIES: AbilityType[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const ABILITY_SHORT: Record<AbilityType, string> = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
};

function modifier(score: number): string {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

function getRacialBonuses(raceId: string, subraceId?: string): Record<AbilityType, number> {
  const race = races.find(r => r.id === raceId);
  if (!race) return {} as Record<AbilityType, number>;
  const bonuses: Partial<Record<AbilityType, number>> = {};
  for (const b of race.abilityBonuses) bonuses[b.ability] = (bonuses[b.ability] ?? 0) + b.bonus;
  if (subraceId) {
    const sub = race.subraces.find(s => s.id === subraceId);
    if (sub) for (const b of sub.abilityBonuses) bonuses[b.ability] = (bonuses[b.ability] ?? 0) + b.bonus;
  }
  return bonuses as Record<AbilityType, number>;
}

export default function SharedBuildPage() {
  return (
    <Suspense fallback={
      <AppShell title="Shared Build">
        <div className="mb-4">
          <BackButton href="/builds" />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading build...</p>
      </AppShell>
    }>
      <SharedBuildContent />
    </Suspense>
  );
}

function SharedBuildContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [build, setBuild] = useState<SavedBuild | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const data = searchParams.get('b');
    if (!data) {
      setError(true);
      return;
    }
    const decoded = decodeBuild(data);
    if (!decoded) {
      setError(true);
      return;
    }
    setBuild(decoded);
  }, [searchParams]);

  const handleSave = useCallback(async () => {
    if (!build) return;
    setSaving(true);
    try {
      await saveBuild(build);
      setSaved(true);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, [build]);

  if (error || !build) {
    return (
      <AppShell title="Shared Build">
        <div className="mb-4">
          <BackButton href="/builds" />
        </div>
        <div className="text-center py-12">
          <p className="font-heading text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Invalid Build Link
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            The shared build link appears to be broken or expired.
          </p>
          <Link
            href="/builds"
            className="font-semibold text-sm inline-block"
            style={{ background: 'var(--gold)', color: '#fff', minHeight: 44, borderRadius: 9999, padding: '12px 24px' }}
          >
            Back to Builds
          </Link>
        </div>
      </AppShell>
    );
  }

  const race = races.find(r => r.id === build.race);
  const subrace = build.subrace ? race?.subraces.find(s => s.id === build.subrace) : null;
  const bg = backgrounds.find(b => b.id === build.background);
  const racial = getRacialBonuses(build.race, build.subrace);
  const usedClasses = [...new Set(build.levels.map(l => l.classId))];

  return (
    <AppShell title="Shared Build">
      <div className="stagger-in mb-5 flex items-center justify-between" style={{ animationDelay: '0s' }}>
        <BackButton href="/builds" />
      </div>

      <div className="stagger-in" style={{ animationDelay: '0.05s' }}>
        <div className="p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
          {/* Header */}
          <h2 className="font-heading text-lg font-bold mb-3" style={{ color: 'var(--gold)' }}>{build.name}</h2>

          {/* Race, Background, Level badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Badge label={race?.name ?? build.race} color="#f59e0b" />
            {subrace && <Badge label={subrace.name} color="#f59e0b" />}
            <Badge label={bg?.name ?? build.background} color="#3b82f6" />
            <Badge label={`Lv ${build.levels.length}`} color="#10b981" />
          </div>

          {/* Classes */}
          <div className="mb-4">
            <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Classes</p>
            {usedClasses.map(classId => {
              const cls = classes.find(c => c.id === classId)!;
              const count = build.levels.filter(l => l.classId === classId).length;
              const subclass = build.levels.find(l => l.classId === classId && l.subclassId);
              const subObj = subclass ? cls.subclasses.find(s => s.id === subclass.subclassId) : null;
              return (
                <div key={classId} className="p-2.5 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.04)', borderLeft: '3px solid var(--gold)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {cls.name} {count} {subObj ? `(${subObj.name})` : ''}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cls.features
                      .filter(f => f.level <= count)
                      .map(f => (
                        <span key={f.name} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Lv{f.level}: {f.name}
                        </span>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ability Scores */}
          <div className="mb-4">
            <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Ability Scores</p>
            <div className="grid grid-cols-3 gap-2">
              {ABILITIES.map(ability => {
                const base = build.baseScores[ability];
                const bonus = racial[ability] ?? 0;
                const final_ = base + bonus;
                return (
                  <div key={ability} className="text-center p-2 rounded-lg" style={{ background: 'var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ABILITY_SHORT[ability]}</p>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{final_}</p>
                    <p className="text-xs" style={{ color: 'var(--gold)' }}>{modifier(final_)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feats */}
          {build.featChoices.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Feats</p>
              <div className="flex flex-col gap-1">
                {build.featChoices.map(fc => {
                  const feat = feats.find(f => f.id === fc.featId);
                  return (
                    <p key={fc.atLevel} className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      Lv{fc.atLevel}: {feat?.name ?? fc.featId}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skills */}
          {build.chosenSkills.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {build.chosenSkills.map(s => <Badge key={s} label={s} />)}
              </div>
            </div>
          )}

          {/* Spells */}
          {build.chosenSpells.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Spells</p>
              {build.chosenSpells.map(sp => {
                const cls = classes.find(c => c.id === sp.classId);
                return (
                  <div key={sp.classId} className="mb-2">
                    <p className="text-xs font-medium" style={{ color: 'var(--gold)' }}>{cls?.name ?? sp.classId}</p>
                    {sp.cantrips.length > 0 && (
                      <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                        Cantrips: {sp.cantrips.join(', ')}
                      </p>
                    )}
                    {sp.spells.length > 0 && (
                      <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                        Spells: {sp.spells.join(', ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="stagger-in flex gap-3 mt-5" style={{ animationDelay: '0.15s' }}>
        {saved ? (
          <>
            <Link
              href={`/builds/new?edit=${build.id}`}
              className="flex items-center justify-center gap-2 py-3 font-semibold text-sm"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                minHeight: 44,
                borderRadius: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                padding: '12px 24px',
              }}
            >
              <Pencil size={16} />
              Edit
            </Link>
            <Link
              href="/builds/saved"
              className="flex-1 py-3 font-semibold text-sm text-center"
              style={{
                background: 'var(--gold)',
                color: 'var(--bg)',
                minHeight: 44,
                borderRadius: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              View in Saved Builds
            </Link>
          </>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 font-semibold text-sm"
            style={{
              background: saving ? 'var(--border)' : 'linear-gradient(135deg, var(--gold), var(--gold-bright))',
              color: saving ? 'var(--text-secondary)' : 'var(--bg)',
              minHeight: 44,
              borderRadius: 9999,
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            {saving ? 'Saving...' : 'Save Build'}
          </button>
        )}
      </div>
    </AppShell>
  );
}
