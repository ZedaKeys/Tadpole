'use client';


import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Trash2, Share2, Shield, Swords, BookOpen, Sparkles, Camera } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BackButton } from '@/components/ui/BackButton';
import { Badge } from '@/components/ui/Badge';
import { loadBuild, deleteBuild } from '@/lib/build-storage';
import { getSharePath } from '@/lib/build-share';
import { exportBuildImage } from '@/lib/build-image';
import { races } from '@/data/races';
import { classes } from '@/data/classes';
import { backgrounds } from '@/data/backgrounds';
import { feats } from '@/data/feats';
import { skills as allSkills } from '@/data/skills';
import { spells as allSpells } from '@/data/spells';
import type { SavedBuild, AbilityType } from '@/types';

const ABILITIES: AbilityType[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const ABILITY_SHORT: Record<AbilityType, string> = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
};
const ABILITY_ICONS: Record<AbilityType, string> = {
  strength: '⚔️', dexterity: '🏹', constitution: '🛡️',
  intelligence: '📖', wisdom: '👁️', charisma: '✨',
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

function getFeatAsiBonuses(choice: { featId: string; asiBoosts?: { ability: AbilityType; amount: number }[] }): Record<AbilityType, number> {
  const result: Partial<Record<AbilityType, number>> = {};
  if (choice.asiBoosts) {
    for (const b of choice.asiBoosts) {
      result[b.ability] = (result[b.ability] ?? 0) + b.amount;
    }
  }
  return result as Record<AbilityType, number>;
}

function BuildViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const buildId = searchParams.get('id');

  const [build, setBuild] = useState<SavedBuild | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageExported, setImageExported] = useState(false);

  useEffect(() => {
    if (!buildId) {
      setLoading(false);
      return;
    }
    loadBuild(buildId).then(b => {
      setBuild(b);
      setLoading(false);
    });
  }, [buildId]);

  const handleShare = useCallback(async () => {
    if (!build) return;
    const sharePath = getSharePath(build);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + '/phone' : '';
    const fullUrl = `${baseUrl}${sharePath}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
    } catch {
      const input = document.createElement('input');
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [build]);

  const handleDelete = useCallback(async () => {
    if (!buildId) return;
    await deleteBuild(buildId);
    router.push('/builds/saved');
  }, [buildId, router]);

  const handleExportImage = useCallback(async () => {
    if (!build) return;
    try {
      await exportBuildImage(build);
      setImageExported(true);
      setTimeout(() => setImageExported(false), 2500);
    } catch (err) {
      console.error('Failed to export build image:', err);
    }
  }, [build]);

  if (loading) {
    return (
      <AppShell title="Build Details">
        <div className="stagger-in" style={{ animationDelay: '0s' }}>
          <BackButton href="/builds/saved" />
        </div>
        <p className="stagger-in text-sm mt-4" style={{ color: 'var(--text-secondary)', animationDelay: '0.1s' }}>Loading...</p>
      </AppShell>
    );
  }

  if (!build) {
    return (
      <AppShell title="Build Not Found">
        <div className="stagger-in" style={{ animationDelay: '0s' }}>
          <BackButton href="/builds/saved" />
        </div>
        <div className="stagger-in text-center py-12" style={{ animationDelay: '0.1s' }}>
          <p className="font-heading text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Build not found</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>This build may have been deleted or the link is invalid.</p>
          <Link
            href="/builds/saved"
            className="font-semibold text-sm inline-block"
            style={{ background: 'var(--gold)', color: '#fff', minHeight: 44, borderRadius: 9999, padding: '12px 24px' }}
          >
            View All Builds
          </Link>
        </div>
      </AppShell>
    );
  }

  // Resolve data
  const race = races.find(r => r.id === build.race);
  const subrace = race?.subraces.find(s => s.id === build.subrace);
  const bg = backgrounds.find(b => b.id === build.background);

  const usedClassIds = [...new Set(build.levels.map(l => l.classId))];
  const classBreakdown = usedClassIds.map(id => {
    const cls = classes.find(c => c.id === id);
    const count = build.levels.filter(l => l.classId === id).length;
    const sub = build.levels.find(l => l.classId === id && l.subclassId);
    const subclassObj = cls?.subclasses.find(sc => sc.id === sub?.subclassId);
    return { id, cls, count, subclassObj };
  });

  const racialBonuses = getRacialBonuses(build.race, build.subrace || undefined);

  // Calculate final ability scores with racial + feat ASI bonuses
  const featAsiTotals: Partial<Record<AbilityType, number>> = {};
  for (const fc of build.featChoices) {
    const bonuses = getFeatAsiBonuses(fc);
    for (const [ability, amount] of Object.entries(bonuses)) {
      featAsiTotals[ability as AbilityType] = (featAsiTotals[ability as AbilityType] ?? 0) + amount;
    }
  }

  const finalScores: Record<AbilityType, number> = {} as Record<AbilityType, number>;
  for (const ability of ABILITIES) {
    finalScores[ability] = build.baseScores[ability] + (racialBonuses[ability] ?? 0) + (featAsiTotals[ability] ?? 0);
  }

  // Resolve feats
  const resolvedFeats = build.featChoices.map(fc => ({
    ...fc,
    feat: feats.find(f => f.id === fc.featId),
  }));

  // Resolve spells
  const allSpellIds = build.chosenSpells.flatMap(cs => [...cs.cantrips, ...cs.spells]);
  const resolvedSpellObjects = allSpellIds
    .map(sid => allSpells.find(s => s.id === sid))
    .filter(Boolean);

  const cantripObjects = build.chosenSpells.flatMap(cs =>
    cs.cantrips.map(sid => allSpells.find(s => s.id === sid)).filter(Boolean)
  );
  const spellObjects = build.chosenSpells.flatMap(cs =>
    cs.spells.map(sid => allSpells.find(s => s.id === sid)).filter(Boolean)
  );

  // Get class features gained
  const allFeatures: { name: string; level: number; className: string }[] = [];
  for (const { id, cls, count } of classBreakdown) {
    if (!cls) continue;
    cls.features
      .filter(f => f.level <= count)
      .forEach(f => allFeatures.push({ name: f.name, level: f.level, className: cls.name }));
  }
  allFeatures.sort((a, b) => a.level - b.level);

  return (
    <AppShell title={build.name}>
      {/* Header actions */}
      <div className="stagger-in mb-4 flex items-center justify-between" style={{ animationDelay: '0s' }}>
        <BackButton href="/builds/saved" />
        <div className="flex items-center gap-2">
          <Link
            href={`/builds/new?edit=${build.id}`}
            className="flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', minHeight: 36, gap: 4 }}
          >
            <Pencil size={14} />
            Edit
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: copied ? '#10b98122' : 'rgba(59, 130, 246, 0.15)', color: copied ? '#10b981' : '#3b82f6', minHeight: 36, gap: 4 }}
          >
            <Share2 size={14} />
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={handleExportImage}
            className="flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: imageExported ? '#10b98122' : 'rgba(168, 130, 46, 0.15)', color: imageExported ? '#10b981' : '#d4a44a', minHeight: 36, gap: 4 }}
          >
            <Camera size={14} />
            {imageExported ? 'Saved!' : 'Image'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: '#ef444422', color: '#ef4444', minHeight: 36, gap: 4 }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="stagger-in mb-4 p-4 rounded-2xl" style={{ background: '#ef444415', border: '1px solid #ef444440', animationDelay: '0.05s' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#ef4444' }}>Delete this build?</p>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>This action cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2 rounded-xl text-xs font-medium"
              style={{ background: 'var(--border)', color: 'var(--text-primary)', minHeight: 36 }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{ background: '#ef4444', color: '#fff', minHeight: 36 }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Build Identity Card */}
      <div className="stagger-in p-4 mb-4" style={{ background: 'linear-gradient(135deg, rgba(198,162,85,0.08), rgba(198,162,85,0.02))', border: '1px solid rgba(198,162,85,0.15)', borderRadius: 20, animationDelay: '0.05s' }}>
        <h1 className="font-heading text-xl font-bold mb-3" style={{ color: 'var(--gold-bright)' }}>{build.name}</h1>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge label={race?.name ?? build.race} color="#f59e0b" />
          {subrace && <Badge label={subrace.name} color="#d97706" />}
          <Badge label={`Lv ${build.levels.length}`} color="#10b981" />
          {classBreakdown.map(({ cls, count }) =>
            cls ? <Badge key={cls.id} label={`${cls.name} ${count}`} color="#3b82f6" /> : null
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {bg?.name ?? build.background} · Created {new Date(build.createdAt).toLocaleDateString()}
        </p>
        {race && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            {race.size} · {race.speed} ft speed
          </p>
        )}
      </div>

      {/* Ability Scores Section */}
      <div className="stagger-in mb-4" style={{ animationDelay: '0.1s' }}>
        <SectionHeader icon="⚔️" title="Ability Scores" />
        <div className="grid grid-cols-3 gap-2">
          {ABILITIES.map(ability => {
            const base = build.baseScores[ability];
            const racial = racialBonuses[ability] ?? 0;
            const featBonus = featAsiTotals[ability] ?? 0;
            const total = finalScores[ability];
            const mod = modifier(total);

            return (
              <div
                key={ability}
                className="p-3 text-center rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-lg mb-0.5">{ABILITY_ICONS[ability]}</div>
                <div className="text-xs font-bold" style={{ color: 'var(--gold)' }}>{ABILITY_SHORT[ability]}</div>
                <div className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{total}</div>
                <div className="text-xs font-medium" style={{ color: 'var(--gold-bright)' }}>{mod}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.625rem' }}>
                  {base}{racial > 0 ? `+${racial}` : ''}{featBonus > 0 ? `+${featBonus}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Class Spread Section */}
      <div className="stagger-in mb-4" style={{ animationDelay: '0.15s' }}>
        <SectionHeader icon="🗡️" title="Class Spread" />
        <div className="flex flex-col gap-3">
          {classBreakdown.map(({ id, cls, count, subclassObj }) => {
            if (!cls) return null;
            return (
              <div
                key={id}
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid var(--gold)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-heading font-bold text-sm" style={{ color: 'var(--gold-bright)' }}>{cls.name}</span>
                  <Badge label={`${count} level${count !== 1 ? 's' : ''}`} color="#3b82f6" />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cls.hitDie} Hit Die</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Primary: {cls.primaryAbility}</span>
                </div>
                {subclassObj && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>Subclass: </span>
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{subclassObj.name}</span>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{subclassObj.description}</p>
                  </div>
                )}
                {/* Class features gained */}
                <div className="mt-2">
                  {cls.features
                    .filter(f => f.level <= count)
                    .map(f => (
                      <div key={f.name} className="flex items-start gap-1.5 py-0.5">
                        <span className="text-xs font-medium" style={{ color: 'var(--gold)', minWidth: 28 }}>Lv{f.level}</span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{f.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Background Section */}
      <div className="stagger-in mb-4" style={{ animationDelay: '0.2s' }}>
        <SectionHeader icon="📜" title="Background" />
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-heading font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{bg?.name ?? build.background}</p>
          {bg?.feature && (
            <p className="text-xs mb-2" style={{ color: 'var(--gold)' }}>Feature: {bg.feature}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {(bg?.skillProficiencies ?? []).map(skill => (
              <Badge key={skill} label={skill} color="#8b5cf6" />
            ))}
          </div>
        </div>
      </div>

      {/* Feats Section */}
      {resolvedFeats.length > 0 && (
        <div className="stagger-in mb-4" style={{ animationDelay: '0.25s' }}>
          <SectionHeader icon="✨" title="Feats & ASI" />
          <div className="flex flex-col gap-2">
            {resolvedFeats.map(fc => (
              <div
                key={fc.atLevel}
                className="p-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm" style={{ color: 'var(--gold-bright)' }}>
                    {fc.feat?.name ?? fc.featId}
                  </span>
                  <Badge label={`Level ${fc.atLevel}`} color="#6366f1" />
                </div>
                {fc.feat?.description && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{fc.feat.description}</p>
                )}
                {fc.asiBoosts && fc.asiBoosts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {fc.asiBoosts.map((b, i) => (
                      <Badge key={i} label={`${ABILITY_SHORT[b.ability]} +${b.amount}`} color="#10b981" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Section */}
      {build.chosenSkills.length > 0 && (
        <div className="stagger-in mb-4" style={{ animationDelay: '0.3s' }}>
          <SectionHeader icon="🎯" title="Skills" />
          <div className="flex flex-wrap gap-2">
            {build.chosenSkills.map(skillName => {
              const skillInfo = allSkills.find(s => s.name === skillName);
              const abilityKey = skillInfo?.ability ?? 'strength';
              const mod = modifier(finalScores[abilityKey] ?? 10);
              return (
                <div
                  key={skillName}
                  className="px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{skillName}</span>
                  <span className="text-xs ml-1.5" style={{ color: 'var(--gold)', fontSize: '0.625rem' }}>({ABILITY_SHORT[abilityKey]} {mod})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spells Section */}
      {(cantripObjects.length > 0 || spellObjects.length > 0) && (
        <div className="stagger-in mb-4" style={{ animationDelay: '0.35s' }}>
          <SectionHeader icon="🔮" title="Spells" />
          {cantripObjects.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>Cantrips</p>
              <div className="flex flex-wrap gap-2">
                {cantripObjects.map(spell => (
                  <div
                    key={spell!.id}
                    className="px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)' }}
                  >
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{spell!.name}</span>
                    <span className="text-xs ml-1" style={{ color: 'var(--text-secondary)', fontSize: '0.625rem' }}>{spell!.school}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {spellObjects.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>Leveled Spells</p>
              <div className="flex flex-col gap-2">
                {spellObjects.map(spell => (
                  <div
                    key={spell!.id}
                    className="px-3 py-2 rounded-xl flex items-center justify-between"
                    style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.12)' }}
                  >
                    <div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{spell!.name}</span>
                      <span className="text-xs ml-1.5" style={{ color: 'var(--text-secondary)', fontSize: '0.625rem' }}>{spell!.school}</span>
                    </div>
                    <Badge label={spell!.level === 0 ? 'Cantrip' : `Level ${spell!.level}`} color={spell!.concentration ? '#f59e0b' : '#6366f1'} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Race Features */}
      {race && race.features.length > 0 && (
        <div className="stagger-in mb-4" style={{ animationDelay: '0.4s' }}>
          <SectionHeader icon="🧬" title="Racial Features" />
          <div className="flex flex-col gap-2">
            {race.features.map(f => (
              <div key={f.name} className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{f.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.description}</p>
              </div>
            ))}
            {subrace && subrace.features.map(f => (
              <div key={f.name} className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{f.name} <span style={{ color: 'var(--text-secondary)', fontSize: '0.625rem' }}>({subrace.name})</span></p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proficiencies */}
      {race && race.proficiencies.length > 0 && (
        <div className="stagger-in mb-8" style={{ animationDelay: '0.45s' }}>
          <SectionHeader icon="🛡️" title="Racial Proficiencies" />
          <div className="flex flex-wrap gap-2">
            {race.proficiencies.map(p => (
              <Badge key={p} label={p} color="#64748b" />
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">{icon}</span>
      <h2 className="font-heading text-sm font-bold" style={{ color: 'var(--gold-bright)' }}>{title}</h2>
    </div>
  );
}

export default function BuildViewPage() {
  return (
    <Suspense fallback={
      <AppShell title="Build Details">
        <div className="stagger-in" style={{ animationDelay: '0s' }}>
          <BackButton href="/builds/saved" />
        </div>
        <p className="stagger-in text-sm mt-4" style={{ color: 'var(--text-secondary)', animationDelay: '0.1s' }}>Loading...</p>
      </AppShell>
    }>
      <BuildViewContent />
    </Suspense>
  );
}
