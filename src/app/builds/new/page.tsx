'use client';

import { Suspense, useReducer, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { BackButton } from '@/components/ui/BackButton';
import { Badge } from '@/components/ui/Badge';
import { races } from '@/data/races';
import { classes } from '@/data/classes';
import { feats } from '@/data/feats';
import { backgrounds } from '@/data/backgrounds';
import { skills as allSkills } from '@/data/skills';
import { saveBuild, loadBuild } from '@/lib/build-storage';
import { spells as spellsData } from '@/data/spells';
import type { AbilityType, BuildLevel, FeatChoice, BuildSpells, SavedBuild } from '@/types';

// ── helpers ──
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

function pointBuyCost(score: number): number {
  if (score <= 13) return score - 8;
  return (score - 8) + (score - 13); // 14 costs 7, 15 costs 9
}

function totalPointsUsed(scores: Record<AbilityType, number>): number {
  return ABILITIES.reduce((sum, a) => sum + pointBuyCost(scores[a]), 0);
}

const FEAT_LEVELS = [4, 8, 12];
const SPELLCASTING_CLASSES = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard']);
const HALF_CASTERS = new Set(['paladin', 'ranger']);

// ── wizard state ──
interface WizardState {
  step: number;
  name: string;
  raceId: string;
  subraceId: string;
  backgroundId: string;
  baseScores: Record<AbilityType, number>;
  levels: BuildLevel[];
  featChoices: FeatChoice[];
  chosenSkills: string[];
  chosenSpells: BuildSpells[];
}

type Action =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_RACE'; raceId: string }
  | { type: 'SET_SUBRACE'; subraceId: string }
  | { type: 'SET_BACKGROUND'; backgroundId: string }
  | { type: 'SET_SCORE'; ability: AbilityType; value: number }
  | { type: 'SET_LEVELS'; levels: BuildLevel[] }
  | { type: 'SET_FEAT'; atLevel: number; featId: string; asiBoosts?: { ability: AbilityType; amount: number }[] }
  | { type: 'TOGGLE_SKILL'; skill: string }
  | { type: 'SET_SPELLS'; classId: string; cantrips: string[]; spells: string[] }
  | { type: 'LOAD_BUILD'; state: WizardState };

const initialState: WizardState = {
  step: 1,
  name: '',
  raceId: '',
  subraceId: '',
  backgroundId: '',
  baseScores: { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 },
  levels: [{ classId: 'fighter' }],
  featChoices: [],
  chosenSkills: [],
  chosenSpells: [],
};

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.step };
    case 'SET_NAME': return { ...state, name: action.name };
    case 'SET_RACE': return { ...state, raceId: action.raceId, subraceId: '' };
    case 'SET_SUBRACE': return { ...state, subraceId: action.subraceId };
    case 'SET_BACKGROUND': return { ...state, backgroundId: action.backgroundId };
    case 'SET_SCORE': return { ...state, baseScores: { ...state.baseScores, [action.ability]: action.value } };
    case 'SET_LEVELS': return { ...state, levels: action.levels };
    case 'SET_FEAT': {
      const existing = state.featChoices.findIndex(f => f.atLevel === action.atLevel);
      const choice: FeatChoice = { atLevel: action.atLevel, featId: action.featId, asiBoosts: action.asiBoosts };
      if (existing >= 0) {
        const updated = [...state.featChoices];
        updated[existing] = choice;
        return { ...state, featChoices: updated };
      }
      return { ...state, featChoices: [...state.featChoices, choice] };
    }
    case 'TOGGLE_SKILL': {
      const has = state.chosenSkills.includes(action.skill);
      return { ...state, chosenSkills: has ? state.chosenSkills.filter(s => s !== action.skill) : [...state.chosenSkills, action.skill] };
    }
    case 'SET_SPELLS': {
      const existing = state.chosenSpells.findIndex(s => s.classId === action.classId);
      const sp: BuildSpells = { classId: action.classId, cantrips: action.cantrips, spells: action.spells };
      if (existing >= 0) {
        const updated = [...state.chosenSpells];
        updated[existing] = sp;
        return { ...state, chosenSpells: updated };
      }
      return { ...state, chosenSpells: [...state.chosenSpells, sp] };
    }
    case 'LOAD_BUILD': return { ...action.state };
  }
}

// ── step components ──

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-4">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            width: i + 1 === current ? 24 : 8,
            height: 8,
            background: i + 1 === current ? 'var(--gold-bright)' : i + 1 < current ? 'var(--gold-muted)' : 'var(--border)',
            boxShadow: i + 1 === current ? '0 0 8px rgba(198, 162, 85, 0.4)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

function NavButtons({ onBack, onNext, canNext, isLast }: {
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={onBack}
        className="flex-1 py-3 rounded-xl font-semibold text-sm"
        style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--gold)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9999, minHeight: 44, padding: '12px 24px' }}
      >
        Back
      </button>
      <button
        onClick={onNext}
        disabled={!canNext}
        className="flex-1 py-3 rounded-xl font-semibold text-sm"
        style={{
          background: canNext ? 'linear-gradient(135deg, var(--gold), var(--gold-bright))' : 'var(--border)',
          color: canNext ? 'var(--bg)' : 'var(--text-secondary)',
          minHeight: 44,
          fontWeight: canNext ? 700 : 400,
          letterSpacing: canNext ? '0.02em' : 'normal',
        }}
      >
        {isLast ? 'Save Build' : 'Next'}
      </button>
    </div>
  );
}

// ── STEP 1: Basics ──
function StepBasics({ state, dispatch }: { state: WizardState; dispatch: React.Dispatch<Action> }) {
  const selectedRace = races.find(r => r.id === state.raceId);
  const [searchBg, setSearchBg] = useState('');
  const filteredBgs = backgrounds.filter(b => b.name.toLowerCase().includes(searchBg.toLowerCase()));
  const [searchRace, setSearchRace] = useState('');
  const filteredRaces = races.filter(r => r.name.toLowerCase().includes(searchRace.toLowerCase()));

  return (
    <div>
      <h2 className="font-heading text-lg font-bold mb-3" style={{ color: 'var(--gold-bright)' }}>Build Name</h2>
      <input
        type="text"
        value={state.name}
        onChange={e => dispatch({ type: 'SET_NAME', name: e.target.value })}
        placeholder="My awesome build..."
        className="w-full px-4 py-3 text-sm"
        style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 14px' }}
      />

      <h2 className="font-heading text-lg font-bold mt-6 mb-3" style={{ color: 'var(--gold-bright)' }}>Race</h2>
      <input
        type="text"
        value={searchRace}
        onChange={e => setSearchRace(e.target.value)}
        placeholder="Search races..."
        className="w-full px-4 py-2 text-sm mb-3"
        style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 14px' }}
      />
      <div className="grid grid-cols-2 gap-2">
        {filteredRaces.map(race => (
          <button
            key={race.id}
            onClick={() => dispatch({ type: 'SET_RACE', raceId: race.id })}
            className="text-left p-3 rounded-xl"
            style={{
              background: state.raceId === race.id ? 'var(--gold-muted)' : 'rgba(255,255,255,0.03)',
              color: state.raceId === race.id ? 'var(--gold-bright)' : 'var(--text-primary)',
              border: `1px solid ${state.raceId === race.id ? 'var(--gold)' : 'var(--border)'}`,
              minHeight: 44,
            }}
          >
            <span className="font-semibold text-sm">{race.name}</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {race.abilityBonuses.map(b => (
                <span key={b.ability} className="text-xs" style={{ opacity: 0.8 }}>
                  {ABILITY_SHORT[b.ability]}+{b.bonus}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {selectedRace && selectedRace.subraces.length > 0 && (
        <>
          <h2 className="font-heading text-lg font-bold mt-6 mb-3" style={{ color: 'var(--gold-bright)' }}>Subrace</h2>
          <div className="grid grid-cols-2 gap-2">
            {selectedRace.subraces.map(sub => (
              <button
                key={sub.id}
                onClick={() => dispatch({ type: 'SET_SUBRACE', subraceId: sub.id })}
                className="text-left p-3 rounded-xl"
                style={{
                  background: state.subraceId === sub.id ? 'var(--gold-muted)' : 'rgba(255,255,255,0.03)',
                  color: state.subraceId === sub.id ? 'var(--gold-bright)' : 'var(--text-primary)',
                  border: `1px solid ${state.subraceId === sub.id ? 'var(--gold)' : 'var(--border)'}`,
                  minHeight: 44,
                }}
              >
                <span className="font-semibold text-sm">{sub.name}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sub.abilityBonuses.map(b => (
                    <span key={b.ability} className="text-xs" style={{ opacity: 0.8 }}>
                      {ABILITY_SHORT[b.ability]}+{b.bonus}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <h2 className="font-heading text-lg font-bold mt-6 mb-3" style={{ color: 'var(--gold-bright)' }}>Background</h2>
      <input
        type="text"
        value={searchBg}
        onChange={e => setSearchBg(e.target.value)}
        placeholder="Search backgrounds..."
        className="w-full px-4 py-2 text-sm mb-3"
        style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 14px' }}
      />
      <div className="flex flex-col gap-2">
        {filteredBgs.map(bg => (
          <button
            key={bg.id}
            onClick={() => dispatch({ type: 'SET_BACKGROUND', backgroundId: bg.id })}
            className="text-left p-3 rounded-xl"
            style={{
              background: state.backgroundId === bg.id ? 'var(--gold-muted)' : 'rgba(255,255,255,0.03)',
              color: state.backgroundId === bg.id ? 'var(--gold-bright)' : 'var(--text-primary)',
              border: `1px solid ${state.backgroundId === bg.id ? 'var(--gold)' : 'var(--border)'}`,
              minHeight: 44,
            }}
          >
            <span className="font-semibold text-sm">{bg.name}</span>
            <p className="text-xs mt-1" style={{ opacity: 0.7 }}>{bg.skillProficiencies.join(', ')}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── STEP 2: Ability Scores ──
function StepAbilities({ state, dispatch }: { state: WizardState; dispatch: React.Dispatch<Action> }) {
  const racial = getRacialBonuses(state.raceId, state.subraceId || undefined);
  const used = totalPointsUsed(state.baseScores);

  return (
    <div>
      <h2 className="font-heading text-lg font-bold mb-1" style={{ color: 'var(--gold-bright)' }}>Ability Scores</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Points remaining: <strong style={{ color: 27 - used > 0 ? 'var(--gold-bright)' : 'var(--text-primary)' }}>{27 - used}</strong> / 27
      </p>

      <div className="flex flex-col gap-3">
        {ABILITIES.map(ability => {
          const base = state.baseScores[ability];
          const bonus = racial[ability] ?? 0;
          const final_ = base + bonus;
          const cost = pointBuyCost(base);
          const canInc = base < 15 && (27 - used) >= pointBuyCost(base + 1) - cost;
          const canDec = base > 8;

          return (
            <div
              key={ability}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}
            >
              <span className="font-bold text-sm w-10" style={{ color: 'var(--gold)' }}>{ABILITY_SHORT[ability]}</span>

              <button
                onClick={() => canDec && dispatch({ type: 'SET_SCORE', ability, value: base - 1 })}
                disabled={!canDec}
                className="flex items-center justify-center rounded-lg font-bold"
                style={{
                  width: 36, height: 36,
                  background: canDec ? 'var(--border)' : 'transparent',
                  color: canDec ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >-</button>

              <div className="flex-1 text-center">
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{base}</span>
                {bonus > 0 && <span className="text-sm ml-1" style={{ color: 'var(--gold-bright)' }}>+{bonus}</span>}
                <span className="text-sm ml-1" style={{ color: 'var(--text-secondary)' }}>= {final_} ({modifier(final_)})</span>
              </div>

              <button
                onClick={() => canInc && dispatch({ type: 'SET_SCORE', ability, value: base + 1 })}
                disabled={!canInc}
                className="flex items-center justify-center rounded-lg font-bold"
                style={{
                  width: 36, height: 36,
                  background: canInc ? 'var(--gold)' : 'transparent',
                  color: canInc ? 'var(--bg)' : 'var(--text-secondary)',
                }}
              >+</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── STEP 3: Class Levels ──
function StepClassLevels({ state, dispatch }: { state: WizardState; dispatch: React.Dispatch<Action> }) {
  const totalLevels = state.levels.length;

  function getClassLevelCount(classId: string): number {
    return state.levels.filter(l => l.classId === classId).length;
  }

  function addLevel(classId: string) {
    if (totalLevels >= 12) return;
    dispatch({ type: 'SET_LEVELS', levels: [...state.levels, { classId }] });
  }

  function removeLevel(classId: string) {
    const idx = state.levels.findLastIndex(l => l.classId === classId);
    if (idx < 0) return;
    const updated = [...state.levels];
    updated.splice(idx, 1);
    dispatch({ type: 'SET_LEVELS', levels: updated });
  }

  const usedClasses = [...new Set(state.levels.map(l => l.classId))];

  return (
    <div>
      <h2 className="font-heading text-lg font-bold mb-1" style={{ color: 'var(--gold-bright)' }}>Class Levels</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        {totalLevels} / 12 levels assigned
      </p>

      {/* Progress bar */}
      <div className="w-full rounded-full h-2 mb-5" style={{ background: 'var(--border)' }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${(totalLevels / 12) * 100}%`, background: 'linear-gradient(90deg, var(--gold), var(--gold-bright))' }} />
      </div>

      {/* Active classes */}
      {usedClasses.map(classId => {
        const cls = classes.find(c => c.id === classId)!;
        const count = getClassLevelCount(classId);
        const hasSubclass = count >= 3;
        const subclass = state.levels.find(l => l.classId === classId && l.subclassId);

        return (
          <div key={classId} className="p-3 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, borderLeft: '3px solid var(--gold)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--gold-bright)' }}>{cls.name}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => removeLevel(classId)} className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'var(--border)', color: 'var(--text-primary)' }}>-</button>
                <span className="font-bold text-sm w-6 text-center" style={{ color: 'var(--gold-bright)' }}>{count}</span>
                <button onClick={() => addLevel(classId)} disabled={totalLevels >= 12} className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: totalLevels < 12 ? 'var(--gold)' : 'var(--border)', color: totalLevels < 12 ? 'var(--bg)' : 'var(--text-secondary)' }}>+</button>
              </div>
            </div>

            {hasSubclass && cls.subclasses.length > 0 && (
              <div className="mt-2">
                <p className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subclass:</p>
                <div className="flex flex-wrap gap-1.5">
                  {cls.subclasses.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        const updated = state.levels.map(l =>
                          l.classId === classId ? { ...l, subclassId: sub.id } : l
                        );
                        dispatch({ type: 'SET_LEVELS', levels: updated });
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        background: subclass?.subclassId === sub.id ? 'var(--gold-muted)' : 'var(--border)',
                        color: subclass?.subclassId === sub.id ? 'var(--gold-bright)' : 'var(--text-primary)',
                        minHeight: 36,
                      }}
                    >{sub.name}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Features at this level */}
            <div className="mt-2">
              {cls.features
                .filter(f => f.level <= count)
                .map(f => (
                  <div key={f.name} className="flex items-start gap-1.5 mt-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--gold)' }}>Lv{f.level}</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{f.name}</span>
                  </div>
                ))}
            </div>
          </div>
        );
      })}

      {/* Add another class */}
      {totalLevels < 12 && (
        <div className="mt-4">
          <p className="text-sm mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Add a class (multiclass):</p>
          <div className="grid grid-cols-2 gap-2">
            {classes.filter(c => !usedClasses.includes(c.id)).map(cls => (
              <button
                key={cls.id}
                onClick={() => addLevel(cls.id)}
                className="p-2.5 rounded-xl text-left text-xs"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 44, color: 'var(--text-primary)', borderRadius: 16 }}
              >
                <span className="font-semibold">{cls.name}</span>
                <span className="block" style={{ color: 'var(--text-secondary)' }}>{cls.hitDie} / {cls.primaryAbility}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── STEP 4: Feats ──
function StepFeats({ state, dispatch }: { state: WizardState; dispatch: React.Dispatch<Action> }) {
  // Determine feat levels based on class levels
  const featLevels = [...FEAT_LEVELS];
  const fighterLevels = state.levels.filter(l => l.classId === 'fighter').length;
  const rogueLevels = state.levels.filter(l => l.classId === 'rogue').length;
  if (fighterLevels >= 6) featLevels.push(6);
  if (rogueLevels >= 10) featLevels.push(10);

  const applicableLevels = featLevels.filter(lv => lv <= state.levels.length).sort((a, b) => a - b);
  const [searchFeat, setSearchFeat] = useState('');

  return (
    <div>
      <h2 className="font-heading text-lg font-bold mb-1" style={{ color: 'var(--gold-bright)' }}>Feats & ASI</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Choose a feat or Ability Score Improvement at each feat level
      </p>

      {applicableLevels.map(level => {
        const choice = state.featChoices.find(f => f.atLevel === level);
        const isASI = choice?.featId === 'ability-improvement';

        return (
          <div key={level} className="p-3 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, borderLeft: '3px solid var(--gold)' }}>
            <p className="font-semibold text-sm mb-2" style={{ color: 'var(--gold-bright)' }}>Level {level}</p>

            <div className="flex gap-2 mb-2">
              <button
                onClick={() => dispatch({ type: 'SET_FEAT', atLevel: level, featId: 'ability-improvement' })}
                className="px-3 py-2 rounded-lg text-xs font-medium"
                style={{
                  background: isASI ? 'var(--gold)' : 'var(--border)',
                  color: isASI ? 'var(--bg)' : 'var(--text-primary)',
                  minHeight: 36,
                }}
              >ASI (+2 / +1+1)</button>
            </div>

            {!isASI && (
              <>
                <input
                  type="text"
                  value={searchFeat}
                  onChange={e => setSearchFeat(e.target.value)}
                  placeholder="Search feats..."
                  className="w-full px-3 py-2 rounded-lg text-xs mb-2"
                  style={{ background: 'var(--border)', color: 'var(--text-primary)', border: 'none' }}
                />
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                  {feats
                    .filter(f => f.id !== 'ability-improvement')
                    .filter(f => f.name.toLowerCase().includes(searchFeat.toLowerCase()))
                    .map(feat => (
                      <button
                        key={feat.id}
                        onClick={() => dispatch({ type: 'SET_FEAT', atLevel: level, featId: feat.id })}
                        className="text-left p-2 rounded-lg text-xs"
                        style={{
                          background: choice?.featId === feat.id ? 'var(--gold-muted)' : 'transparent',
                          color: choice?.featId === feat.id ? 'var(--gold-bright)' : 'var(--text-primary)',
                          minHeight: 36,
                        }}
                      >
                        <span className="font-medium">{feat.name}</span>
                        {feat.isHalfFeat && <Badge label="Half" color="#f59e0b" />}
                        <p className="mt-0.5" style={{ opacity: 0.7 }}>{feat.description.slice(0, 100)}...</p>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        );
      })}

      {applicableLevels.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          No feat levels reached yet. You need at least 4 levels.
        </p>
      )}
    </div>
  );
}

// ── STEP 5: Skills ──
function StepSkills({ state, dispatch }: { state: WizardState; dispatch: React.Dispatch<Action> }) {
  const bg = backgrounds.find(b => b.id === state.backgroundId);
  const race = races.find(r => r.id === state.raceId);
  const subrace = state.subraceId ? race?.subraces.find(s => s.id === state.subraceId) : null;

  // Background skills (auto)
  const bgSkills = bg?.skillProficiencies ?? [];
  // Racial proficiencies that are skills
  const raceProfs = [...(race?.proficiencies ?? []), ...(subrace?.proficiencies ?? [])].filter(p =>
    allSkills.some(s => s.name === p)
  );

  // Class skills available
  const usedClasses = [...new Set(state.levels.map(l => l.classId))];
  const firstClass = classes.find(c => c.id === usedClasses[0]);

  // For simplicity, show all skills and let user pick from a reasonable pool
  const autoSkills = [...new Set([...bgSkills, ...raceProfs])];
  const remainingPicks = Math.max(0, (firstClass ? 2 : 0) + (usedClasses.length > 1 ? 1 : 0));
  const pickedNonAuto = state.chosenSkills.filter(s => !autoSkills.includes(s));

  return (
    <div>
      <h2 className="font-heading text-lg font-bold mb-1" style={{ color: 'var(--gold-bright)' }}>Skills</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Pick {remainingPicks} skill{remainingPicks !== 1 ? 's' : ''} from your class list
      </p>

      {/* Auto-granted */}
      {autoSkills.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--gold)' }}>Auto-granted</p>
          <div className="flex flex-wrap gap-1.5">
            {autoSkills.map(skill => (
              <Badge key={skill} label={skill} color="var(--gold)" />
            ))}
          </div>
        </div>
      )}

      {/* Pickable skills */}
      <div className="flex flex-col gap-2">
        {allSkills.map(skill => {
          const isAuto = autoSkills.includes(skill.name);
          const isPicked = state.chosenSkills.includes(skill.name);
          const canPick = !isAuto && (isPicked || pickedNonAuto.length < remainingPicks);

          return (
            <button
              key={skill.name}
              onClick={() => !isAuto && canPick && dispatch({ type: 'TOGGLE_SKILL', skill: skill.name })}
              disabled={isAuto || (!canPick && !isPicked)}
              className="flex items-center justify-between p-3 rounded-xl text-left"
              style={{
                background: isAuto ? 'var(--gold-muted)' : isPicked ? 'var(--gold-muted)' : 'rgba(255,255,255,0.03)',
                color: isAuto || isPicked ? 'var(--gold-bright)' : 'var(--text-primary)',
                border: `1px solid ${isAuto || isPicked ? 'var(--gold)' : 'var(--border)'}`,
                opacity: isAuto ? 0.7 : !canPick && !isPicked ? 0.4 : 1,
                minHeight: 44,
              }}
            >
              <div>
                <span className="font-medium text-sm">{skill.name}</span>
                <span className="text-xs ml-2" style={{ opacity: 0.7 }}>({ABILITY_SHORT[skill.ability]})</span>
              </div>
              {(isAuto || isPicked) && <span className="text-xs font-bold">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── STEP 6: Spells ──
function StepSpells({ state, dispatch }: { state: WizardState; dispatch: React.Dispatch<Action> }) {
  const usedClasses = [...new Set(state.levels.map(l => l.classId))];
  const castingClasses = usedClasses.filter(id => SPELLCASTING_CLASSES.has(id) || HALF_CASTERS.has(id));
  const [searchSpell, setSearchSpell] = useState('');

  if (castingClasses.length === 0) {
    return (
      <div>
        <h2 className="font-heading text-lg font-bold mb-1" style={{ color: 'var(--gold-bright)' }}>Spells</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          No spellcasting classes selected. Skip this step.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-bold mb-1" style={{ color: 'var(--gold-bright)' }}>Spells</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Select cantrips and spells for your casting classes
      </p>

      {castingClasses.map(classId => {
        const cls = classes.find(c => c.id === classId)!;
        const classLevel = state.levels.filter(l => l.classId === classId).length;
        const spellData = state.chosenSpells.find(s => s.classId === classId) ?? { classId, cantrips: [], spells: [] };

        // Get spells for this class — use dynamic import via window or inline
        // We import at the top and use the module-level reference
        const classSpells = spellsData.filter((s) => s.classes.some((c: string) => c.toLowerCase() === cls.name.toLowerCase()));
        const cantrips = classSpells.filter((s) => s.level === 0);
        const leveled = classSpells.filter((s) => s.level > 0 && s.level <= Math.ceil(classLevel / 2));
        const filtered = [...cantrips, ...leveled].filter((s) => s.name.toLowerCase().includes(searchSpell.toLowerCase()));

        function toggleSpell(spellName: string, isCantrip: boolean) {
          const list = isCantrip ? spellData.cantrips : spellData.spells;
          const has = list.includes(spellName);
          dispatch({
            type: 'SET_SPELLS',
            classId,
            cantrips: isCantrip ? (has ? list.filter((n: string) => n !== spellName) : [...list, spellName]) : spellData.cantrips,
            spells: !isCantrip ? (has ? list.filter((n: string) => n !== spellName) : [...list, spellName]) : spellData.spells,
          });
        }

        return (
          <div key={classId} className="p-3 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
            <p className="font-semibold text-sm mb-2" style={{ color: 'var(--gold)' }}>{cls.name} (Lv {classLevel})</p>
            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
              {spellData.cantrips.length} cantrip(s), {spellData.spells.length} spell(s) selected
            </p>

            <input
              type="text"
              value={searchSpell}
              onChange={e => setSearchSpell(e.target.value)}
              placeholder="Search spells..."
              className="w-full px-3 py-2 rounded-lg text-xs mb-2"
              style={{ background: 'var(--border)', color: 'var(--text-primary)', border: 'none' }}
            />

            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {filtered.map((spell) => {
                const isCantrip = spell.level === 0;
                const isSelected = isCantrip
                  ? spellData.cantrips.includes(spell.name)
                  : spellData.spells.includes(spell.name);

                return (
                  <button
                    key={spell.id}
                    onClick={() => toggleSpell(spell.name, isCantrip)}
                    className="flex items-center justify-between p-2 rounded-lg text-xs text-left"
                    style={{
                      background: isSelected ? 'var(--gold-muted)' : 'transparent',
                      color: isSelected ? 'var(--gold-bright)' : 'var(--text-primary)',
                      minHeight: 36,
                    }}
                  >
                    <span>
                      <span className="font-medium">{spell.name}</span>
                      <span className="ml-1.5" style={{ opacity: 0.7 }}>
                        {isCantrip ? 'Cantrip' : `Lv ${spell.level}`}
                      </span>
                    </span>
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── STEP 7: Summary ──
function StepSummary({ state }: { state: WizardState }) {
  const race = races.find(r => r.id === state.raceId);
  const subrace = state.subraceId ? race?.subraces.find(s => s.id === state.subraceId) : null;
  const bg = backgrounds.find(b => b.id === state.backgroundId);
  const racial = getRacialBonuses(state.raceId, state.subraceId || undefined);
  const usedClasses = [...new Set(state.levels.map(l => l.classId))];

  return (
    <div>
      <h2 className="font-heading text-lg font-bold mb-3" style={{ color: 'var(--gold-bright)' }}>Build Summary</h2>

      <div className="p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
        <h3 className="font-bold text-base mb-3" style={{ color: 'var(--gold)' }}>{state.name || 'Unnamed Build'}</h3>

        {/* Race & Background */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge label={race?.name ?? ''} color="#f59e0b" />
          {subrace && <Badge label={subrace.name} color="#f59e0b" />}
          <Badge label={bg?.name ?? ''} color="#3b82f6" />
          <Badge label={`Lv ${state.levels.length}`} color="#10b981" />
        </div>

        {/* Classes */}
        <div className="mb-3">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Classes</p>
          {usedClasses.map(classId => {
            const cls = classes.find(c => c.id === classId)!;
            const count = state.levels.filter(l => l.classId === classId).length;
            const subclass = state.levels.find(l => l.classId === classId && l.subclassId);
            const subObj = subclass ? cls.subclasses.find(s => s.id === subclass.subclassId) : null;
            return (
              <p key={classId} className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {cls.name} {count} {subObj ? `(${subObj.name})` : ''}
              </p>
            );
          })}
        </div>

        {/* Ability Scores */}
        <div className="mb-3">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ability Scores</p>
          <div className="grid grid-cols-3 gap-2">
            {ABILITIES.map(ability => {
              const base = state.baseScores[ability];
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
        {state.featChoices.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Feats</p>
            {state.featChoices.map(fc => {
              const feat = feats.find(f => f.id === fc.featId);
              return (
                <p key={fc.atLevel} className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Lv{fc.atLevel}: {feat?.name ?? fc.featId}
                </p>
              );
            })}
          </div>
        )}

        {/* Skills */}
        {state.chosenSkills.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {state.chosenSkills.map(s => <Badge key={s} label={s} />)}
            </div>
          </div>
        )}

        {/* Spells */}
        {state.chosenSpells.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Spells</p>
            {state.chosenSpells.map(sp => (
              <div key={sp.classId}>
                <p className="text-xs font-medium" style={{ color: 'var(--gold)' }}>{sp.classId}</p>
                <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                  {sp.cantrips.join(', ')} {sp.cantrips.length > 0 && '|'} {sp.spells.join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──
export default function NewBuildPage() {
  return (
    <Suspense fallback={
      <AppShell title="New Build">
        <div className="mb-4">
          <BackButton href="/builds" />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </AppShell>
    }>
      <NewBuildContent />
    </Suspense>
  );
}

function buildToState(build: SavedBuild): WizardState {
  return {
    step: 1,
    name: build.name,
    raceId: build.race,
    subraceId: build.subrace ?? '',
    backgroundId: build.background,
    baseScores: build.baseScores,
    levels: build.levels,
    featChoices: build.featChoices,
    chosenSkills: build.chosenSkills,
    chosenSpells: build.chosenSpells,
  };
}

function NewBuildContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [loaded, setLoaded] = useState(!editId);
  const [editBuildId, setEditBuildId] = useState<string | null>(null);
  const [editCreatedAt, setEditCreatedAt] = useState<number | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return;
    loadBuild(editId).then(build => {
      if (build) {
        setEditBuildId(build.id);
        setEditCreatedAt(build.createdAt);
        dispatch({ type: 'LOAD_BUILD', state: buildToState(build) });
      }
      setLoaded(true);
    });
  }, [editId]);

  const totalSteps = state.levels.some(l => SPELLCASTING_CLASSES.has(l.classId) || HALF_CASTERS.has(l.classId)) ? 7 : 6;
  const currentStep = state.step > totalSteps ? totalSteps : state.step;
  const hasSpells = state.levels.some(l => SPELLCASTING_CLASSES.has(l.classId) || HALF_CASTERS.has(l.classId));
  const isEditing = !!editBuildId;

  function canProceed(step: number): boolean {
    switch (step) {
      case 1: return state.name.trim() !== '' && state.raceId !== '' && state.backgroundId !== '';
      case 2: return true; // point buy is always valid
      case 3: return state.levels.length >= 1;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      default: return true;
    }
  }

  async function handleSave() {
    setSaving(true);
    const now = Date.now();
    const build: SavedBuild = {
      id: isEditing ? editBuildId! : crypto.randomUUID(),
      name: state.name,
      createdAt: isEditing ? editCreatedAt! : now,
      updatedAt: now,
      race: state.raceId,
      subrace: state.subraceId || undefined,
      background: state.backgroundId,
      baseScores: state.baseScores,
      levels: state.levels,
      featChoices: state.featChoices,
      chosenSkills: state.chosenSkills,
      chosenSpells: state.chosenSpells,
    };
    await saveBuild(build);
    router.push('/builds/saved');
  }

  function nextStep() {
    if (currentStep === totalSteps) {
      handleSave();
      return;
    }
    let next = currentStep + 1;
    if (next === 6 && !hasSpells) next = 7; // skip spells step
    dispatch({ type: 'SET_STEP', step: next });
  }

  function prevStep() {
    if (currentStep <= 1) { router.push('/builds'); return; }
    let prev = currentStep - 1;
    if (prev === 6 && !hasSpells) prev = 5; // skip spells step going back
    dispatch({ type: 'SET_STEP', step: prev });
  }

  if (!loaded) {
    return (
      <AppShell title="Edit Build">
        <div className="mb-4">
          <BackButton href="/builds" />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading build...</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={isEditing ? 'Edit Build' : 'New Build'}>
      <div className="mb-4">
        <BackButton href="/builds" />
      </div>

      <StepIndicator current={currentStep} total={totalSteps} />

      {currentStep === 1 && <StepBasics state={state} dispatch={dispatch} />}
      {currentStep === 2 && <StepAbilities state={state} dispatch={dispatch} />}
      {currentStep === 3 && <StepClassLevels state={state} dispatch={dispatch} />}
      {currentStep === 4 && <StepFeats state={state} dispatch={dispatch} />}
      {currentStep === 5 && <StepSkills state={state} dispatch={dispatch} />}
      {currentStep === 6 && hasSpells && <StepSpells state={state} dispatch={dispatch} />}
      {(currentStep === 7 || (currentStep === 6 && !hasSpells)) && <StepSummary state={state} />}

      <NavButtons
        onBack={prevStep}
        onNext={nextStep}
        canNext={canProceed(currentStep) && !saving}
        isLast={currentStep === totalSteps}
      />
    </AppShell>
  );
}
