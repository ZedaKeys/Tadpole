'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { spells } from '@/data/spells';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    minHeight: 36,
    paddingLeft: 8,
    paddingRight: 8,
    minWidth: 0,
  };

  return (
    <AppShell title="Spells" onSearchClick={() => setSearchOpen(true)}>
      {/* Count */}
      <p
        className="mb-3"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
      >
        {filteredSpells.length} spell{filteredSpells.length !== 1 ? 's' : ''}
      </p>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto" style={{ paddingBottom: 4 }}>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(Number(e.target.value))}
          style={selectStyle}
        >
          <option value={-1}>All Levels</option>
          {[0, 1, 2, 3, 4, 5, 6].map((lv) => (
            <option key={lv} value={lv}>
              {levelLabel(lv)}
            </option>
          ))}
        </select>

        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Schools</option>
          {SCHOOLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Classes</option>
          {ALL_CLASSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search spells..."
          className="w-full rounded-lg pl-10 pr-3 py-2.5"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            minHeight: 44,
          }}
        />
      </div>

      {/* Spell grid */}
      {filteredSpells.length === 0 ? (
        <EmptyState
          title="No spells found"
          description="Try adjusting your filters or search query."
          icon={<Search size={40} />}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredSpells.map((spell) => (
            <Card
              key={spell.id}
              title={spell.name}
              href={`/spells/${spell.id}`}
              description={`${levelLabel(spell.level)} · ${spell.castingTime}`}
              icon={
                <div className="flex flex-wrap gap-1">
                  <Badge
                    label={spell.school}
                    color={SCHOOL_COLORS[spell.school]}
                  />
                  {spell.concentration && (
                    <Badge label="C" color="#f59e0b" />
                  )}
                  {spell.ritual && (
                    <Badge label="R" color="#8b5cf6" />
                  )}
                </div>
              }
            />
          ))}
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
