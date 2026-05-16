'use client';


import { useState, useMemo, type CSSProperties } from 'react';
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
      <div className="premium-page-header stagger-in">
        {/* Ambient golden glow */}
        <div aria-hidden="true" className="hero-glow" />

        <h1 className="font-heading premium-page-title">
          Arcane Grimoire
        </h1>

        <p className="premium-page-subtitle stagger-in stagger-1">
          Browse and search the complete spell compendium
        </p>

        {/* Gold divider */}
        <div className="premium-divider stagger-in stagger-2" />
      </div>

      {/* Count */}
      <p className="premium-count stagger-in stagger-2 mb-3">
        {filteredSpells.length} spell{filteredSpells.length !== 1 ? 's' : ''}
      </p>

      {/* Filter bar — level pills */}
      <div className="filter-row mb-5 stagger-in stagger-3">
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
      <div className="filter-row mb-5 stagger-in stagger-4">
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
              style={{ '--dot-color': SCHOOL_COLORS[s] } as CSSProperties}
            />
            {s}
          </button>
        ))}
      </div>

      {/* Class pills */}
      <div className="filter-row mb-5 stagger-in stagger-5">
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
      <div className="premium-search-shell stagger-in stagger-6 mb-4">
        <Search
          size={16}
          strokeWidth={1.8}
          className="premium-search-icon"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search spells..."
          className="premium-search-input"
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
                className="bg3-card-premium premium-card-link touch-target stagger-in"
                style={{
                  animationDelay: `${0.3 + i * 0.04}s`,
                  '--item-color': schoolColor,
                } as CSSProperties}
              >
                <div
                  className="card-inner premium-card-row-inner"
                >
                  {/* School accent left bar */}
                  <div
                    aria-hidden="true"
                    className="premium-accent-bar"
                  />

                  {/* School color dot */}
                  <div
                    className="spell-school-dot spell-school-dot-lg"
                    style={{ '--dot-color': schoolColor } as CSSProperties}
                  />

                  {/* Spell info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-heading premium-card-title truncate"
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
                      <span className="premium-card-meta">
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
