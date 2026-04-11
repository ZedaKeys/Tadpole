'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { items } from '@/data/items';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import type { ItemRarity, ItemType } from '@/types';

const RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'very rare', 'legendary'];
const TYPES: ItemType[] = ['weapon', 'armor', 'accessory', 'consumable', 'misc'];
const ACTS = [1, 2, 3];

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'var(--rarity-common)',
  uncommon: 'var(--rarity-uncommon)',
  rare: 'var(--rarity-rare)',
  'very rare': 'var(--rarity-very-rare)',
  legendary: 'var(--rarity-legendary)',
};

const TYPE_LABELS: Record<ItemType, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  accessory: 'Accessory',
  consumable: 'Consumable',
  misc: 'Misc',
};

export default function ItemsPage() {
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | ''>('');
  const [typeFilter, setTypeFilter] = useState<ItemType | ''>('');
  const [actFilter, setActFilter] = useState<number | 0>(0);
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    let list = items;

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q),
      );
    }

    if (rarityFilter) {
      list = list.filter((item) => item.rarity === rarityFilter);
    }
    if (typeFilter) {
      list = list.filter((item) => item.type === typeFilter);
    }
    if (actFilter > 0) {
      list = list.filter((item) => item.act === actFilter);
    }

    return list;
  }, [query, rarityFilter, typeFilter, actFilter]);

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
    <AppShell title="Items">
      {/* Count */}
      <p
        className="mb-3"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
      >
        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
      </p>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto" style={{ paddingBottom: 4 }}>
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value as ItemRarity | '')}
          style={selectStyle}
        >
          <option value="">All Rarities</option>
          {RARITIES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ItemType | '')}
          style={selectStyle}
        >
          <option value="">All Types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <select
          value={actFilter}
          onChange={(e) => setActFilter(Number(e.target.value))}
          style={selectStyle}
        >
          <option value={0}>All Acts</option>
          {ACTS.map((a) => (
            <option key={a} value={a}>
              Act {a}
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
          placeholder="Search items..."
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

      {/* Items grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No items found"
          description="Try adjusting your filters or search query."
          icon={<Search size={40} />}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <a
              key={item.id}
              href={`/items/${item.id}`}
              className="touch-target rounded-xl p-4 flex flex-col transition-colors"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--surface-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'var(--surface)')
              }
            >
              <div className="flex flex-wrap gap-1 mb-2">
                <Badge
                  label={TYPE_LABELS[item.type]}
                  color="var(--accent)"
                />
                <Badge
                  label={item.rarity}
                  color={RARITY_COLORS[item.rarity]}
                />
              </div>
              <h3
                className="font-semibold text-sm leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.name}
              </h3>
              <p
                className="text-xs mt-1 leading-snug"
                style={{ color: 'var(--text-secondary)' }}
              >
                Act {item.act}
              </p>
            </a>
          ))}
        </div>
      )}
    </AppShell>
  );
}
