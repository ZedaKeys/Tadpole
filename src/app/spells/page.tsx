'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { spells } from '@/data/spells';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchModal } from '@/components/ui/SearchModal';
import { AppShell } from '@/components/layout/AppShell';
import { useSearch } from '@/hooks/useSearch';
import { fuzzySearch } from '@/lib/search';
import type { Spell } from '@/types';

type SearchableSpell = Spell & { [key: string]: unknown };

const SCHOOLS = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
];

const ALL_CLASSES = Array.from(
  new Set(spells.flatMap((s) => s.classes)),
).sort();

const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: '#f59e0b',
  Conjuration: '#3b82f6',
  Divination: '#a855f7',
  Enchantment: '#ec4899',
  Evocation: '#ef4444',
  Illusion: '#6366f1',
  Necromancy: '#22c55e',
  Transmutation: '#14b8a6',
};

function levelLabel(level: number): string {
  if (level === 0) return 'Cantrip';
  return `Level ${level}`;
}

export default function SpellsPage() {
  const [levelFilter, setLevelFilter] = useState<number | -1>(-1);
  const [schoolFilter, setSchoolFilter] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState(false);
  const { query, setQuery, results: searchResults } = useSearch<SearchableSpell>(spells as SearchableSpell[], ['name', 'school']);

  const filteredSpells = useMemo(() => {
    let list = searchResults;

    if (levelFilter >= 0) {
      list = list.filter((s) => s.level === levelFilter);
    }
    if (schoolFilter) {
      list = list.filter((s) => s.school === schoolFilter);
    }
    if (classFilter) {
      list = list.filter((s) => s.classes.includes(classFilter));
    }

    return list;
  }, [searchResults, levelFilter, schoolFilter, classFilter]);

  const handleSearchModal = (q: string) => {
    return fuzzySearch(
      spells as unknown as Record<string, unknown>[],
      q,
      ['name', 'school'],
    ) as import('@/lib/search').ScoredResult<Record<string, unknown>>[];
  };

  return (
    <AppShell title="Spells" onSearchClick={() => setSearchOpen(true)}>
      {/* ═══ Page Header ═══════════════════════════════════════════════════ */}
      <div
        className="stagger-in"
        style={{
          position: 'relative',
          textAlign: 'center',
          paddingTop: 24,
          paddingBottom: 12,
          paddingLeft: 32,
          paddingRight: 32,
        }}
      >
        {/* Ambient golden glow */}
        <div
          aria-hidden="true"
          className="hero-glow"
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 280,
            height: 140,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(139, 92, 246, 0.10) 0%, rgba(139, 92, 246, 0.03) 40%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(30px)',
          }}
        />

        <h1
          className="font-heading"
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--gold)',
            lineHeight: 1.2,
            textShadow:
              '0 0 40px rgba(198, 162, 85, 0.20), 0 2px 4px rgba(0, 0, 0, 0.4)',
            position: 'relative',
          }}
        >
          Arcane Grimoire
        </h1>

        <p
          className="stagger-in"
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            marginTop: 6,
            letterSpacing: '0.02em',
            position: 'relative',
            animationDelay: '0.05s',
          }}
        >
          Browse and search the complete spell compendium
        </p>

        {/* Gold divider */}
        <div
          className="stagger-in"
          style={{
            marginTop: 18,
            marginLeft: 60,
            marginRight: 60,
            height: 2,
            background:
              'linear-gradient(90deg, transparent 0%, var(--gold-dim) 20%, var(--gold) 50%, var(--gold-dim) 80%, transparent 100%)',
            opacity: 0.4,
            position: 'relative',
            animationDelay: '0.1s',
          }}
        />
      </div>

      {/* Count */}
      <p
        className="stagger-in mb-3"
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          animationDelay: '0.12s',
        }}
      >
        {filteredSpells.length} spell{filteredSpells.length !== 1 ? 's' : ''}
      </p>

      {/* Filter bar — level pills */}
      <div className="filter-row mb-5 stagger-in" style={{ animationDelay: '0.14s' }}>
        <button
          className={`pill-btn pill-btn-ghost pill-sm ${levelFilter === -1 ? 'pill-btn-ghost-active' : ''}`}
          onClick={() => setLevelFilter(-1)}
        >
          All
        </button>
        {[0, 1, 2, 3, 4, 5, 6].map((lv) => (
          <button
            key={lv}
            className={`pill-btn pill-btn-ghost pill-sm ${levelFilter === lv ? 'pill-btn-ghost-active' : ''}`}
            onClick={() => setLevelFilter(levelFilter === lv ? -1 : lv)}
          >
            {levelLabel(lv)}
          </button>
        ))}
      </div>

      {/* School pills */}
      <div className="filter-row mb-5 stagger-in" style={{ animationDelay: '0.18s' }}>
        <button
          className={`pill-btn pill-btn-ghost pill-sm ${schoolFilter === '' ? 'pill-btn-ghost-active' : ''}`}
          onClick={() => setSchoolFilter('')}
        >
          All Schools
        </button>
        {SCHOOLS.map((s) => (
          <button
            key={s}
            className={`pill-btn pill-btn-ghost pill-sm ${schoolFilter === s ? 'pill-btn-ghost-active' : ''}`}
            onClick={() => setSchoolFilter(schoolFilter === s ? '' : s)}
          >
            <span
              className="spell-school-dot"
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                marginRight: 6,
                background: SCHOOL_COLORS[s],
                '--dot-color': SCHOOL_COLORS[s],
              } as React.CSSProperties}
            />
            {s}
          </button>
        ))}
      </div>

      {/* Class pills */}
      <div className="filter-row mb-5 stagger-in" style={{ animationDelay: '0.22s' }}>
        <button
          className={`pill-btn pill-btn-ghost pill-sm ${classFilter === '' ? 'pill-btn-ghost-active' : ''}`}
          onClick={() => setClassFilter('')}
        >
          All Classes
        </button>
        {ALL_CLASSES.map((c) => (
          <button
            key={c}
            className={`pill-btn pill-btn-ghost pill-sm ${classFilter === c ? 'pill-btn-ghost-active' : ''}`}
            onClick={() => setClassFilter(classFilter === c ? '' : c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Search input — glass panel style */}
      <div
        className="stagger-in"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 16,
          position: 'relative',
          animationDelay: '0.26s',
        }}
      >
        <Search
          size={16}
          strokeWidth={1.8}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            zIndex: 1,
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search spells..."
          className="w-full"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            padding: '12px 14px 12px 40px',
            minHeight: 44,
            outline: 'none',
          }}
        />
      </div>

      {/* Spell list */}
      {filteredSpells.length === 0 ? (
        <EmptyState
          title="No spells found"
          description="Try adjusting your filters or search query."
          icon={<Search size={40} />}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filteredSpells.map((spell, i) => {
            const schoolColor = SCHOOL_COLORS[spell.school] ?? 'var(--gold-dim)';

            return (
              <a
                key={spell.id}
                href={`/spells/${spell.id}`}
                className="bg3-card-premium touch-target stagger-in"
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  animationDelay: `${0.3 + i * 0.04}s`,
                }}
              >
                <div
                  className="card-inner"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    position: 'relative',
                    background: `linear-gradient(160deg, ${schoolColor}0C, rgba(255,255,255,0.02))`,
                  }}
                >
                  {/* School accent left bar */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 4,
                      bottom: 4,
                      width: 3,
                      borderRadius: 2,
                      background: schoolColor,
                    }}
                  />

                  {/* School color dot */}
                  <div
                    className="spell-school-dot"
                    style={{
                      background: schoolColor,
                      '--dot-color': schoolColor,
                      marginLeft: 6,
                    } as React.CSSProperties}
                  />

                  {/* Spell info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-heading truncate"
                        style={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {spell.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge label={spell.school} color={schoolColor} />
                      {spell.concentration && (
                        <Badge label="C" color="var(--gold-bright)" />
                      )}
                      {spell.ritual && (
                        <Badge label="R" color="var(--arcane)" />
                      )}
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}
                      >
                        {levelLabel(spell.level)} · {spell.castingTime}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Search modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        placeholder="Search spells..."
        onSearch={handleSearchModal}
      />
    </AppShell>
  );
}
