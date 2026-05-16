'use client';


import { useState, useMemo, type CSSProperties } from 'react';
import Link from 'next/link';
import { Search, Swords } from 'lucide-react';
import { items } from '@/data/items';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import type { ItemRarity, ItemType } from '@/types';

const RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'very rare', 'legendary'];
const TYPES: ItemType[] = ['weapon', 'armor', 'accessory', 'consumable', 'misc'];
const ACTS = [1, 2, 3];

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#a3a3a3',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  'very rare': '#a855f7',
  legendary: '#f59e0b',
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

  return (
    <AppShell title="Items">
      {/* Equipment guide link */}
      <Link
        href="/items/equipment"
        className="premium-guide-link premium-guide-link-gold stagger-in mb-5"
      >
        <div className="premium-guide-icon">
          <Swords size={20} />
        </div>
        <div>
          <div className="premium-guide-title">
            Equipment Guide
          </div>
          <div className="premium-guide-subtitle">
            Class-specific gear recommendations by act
          </div>
        </div>
      </Link>

      {/* Count */}
      <p className="premium-count mb-5">
        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
      </p>

      {/* Filter bar */}
      <div className="filter-row mb-6">
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value as ItemRarity | '')}
          className="bg3-select"
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
          className="bg3-select"
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
          className="bg3-select"
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
      <div className="premium-search-shell mb-6">
        <Search
          size={18}
          className="premium-search-icon"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items..."
          className="premium-search-input"
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
          {filteredItems.map((item, i) => (
            <a
              key={item.id}
              href={`/items/${item.id}`}
              className="bg3-card-premium premium-card-link touch-target stagger-in"
              style={{
                animationDelay: `${0.05 + i * 0.04}s`,
                '--item-color': RARITY_COLORS[item.rarity],
              } as CSSProperties}
            >
              <div
                className="card-inner premium-card-column-inner"
              >
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge
                    label={TYPE_LABELS[item.type]}
                    color="var(--gold)"
                  />
                  <Badge
                    label={item.rarity}
                    color={RARITY_COLORS[item.rarity]}
                  />
                </div>
                <h3 className="font-heading premium-card-title leading-tight truncate">
                  {item.name}
                </h3>
                <p className="premium-card-meta premium-card-meta-gold mt-2 leading-snug">
                  Act {item.act}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </AppShell>
  );
}
