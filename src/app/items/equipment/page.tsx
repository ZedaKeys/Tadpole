'use client';

import { useState, useMemo } from 'react';
import { Sword, Shield, Gem, ChevronDown, Search, Swords, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { equipmentSuggestions } from '@/data/equipment-suggestions';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import type { EquipmentCategory } from '@/data/equipment-suggestions';

const CATEGORY_ICONS: Record<EquipmentCategory, typeof Sword> = {
  weapon: Sword,
  armor: Shield,
  accessory: Gem,
};

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  weapon: 'Weapons',
  armor: 'Armor',
  accessory: 'Accessories',
};

const CATEGORY_COLORS: Record<EquipmentCategory, string> = {
  weapon: '#e74c3c',
  armor: '#3498db',
  accessory: '#9b59b6',
};

const ACT_COLORS: Record<number, string> = {
  1: '#27ae60',
  2: '#f39c12',
  3: '#e74c3c',
};

const RARITY_COLORS: Record<string, string> = {
  uncommon: '#1eff00',
  rare: '#0070dd',
  'very rare': '#a335ee',
  legendary: '#ff8000',
};

export default function EquipmentPage() {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  const classData = useMemo(() => {
    if (!selectedClass) return null;
    return equipmentSuggestions.find((c) => c.classId === selectedClass) ?? null;
  }, [selectedClass]);

  const filteredCategories = useMemo(() => {
    if (!classData) return [];
    if (!query) return classData.categories;

    const q = query.toLowerCase();
    return classData.categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.why.toLowerCase().includes(q) ||
            item.location.toLowerCase().includes(q) ||
            item.rarity.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [classData, query]);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AppShell title="Equipment Guide">
      {/* Back link */}
      <Link
        href="/items"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          textDecoration: 'none',
          marginBottom: 16,
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Items</span>
      </Link>

      {/* Class selector */}
      <div style={{ marginBottom: 20 }}>
        <label
          htmlFor="class-select"
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Choose your class
        </label>
        <select
          id="class-select"
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            setExpandedCategories({});
            setQuery('');
          }}
          className="bg3-select w-full"
          style={{ fontSize: '0.95rem' }}
        >
          <option value="">Select a class...</option>
          {equipmentSuggestions.map((c) => (
            <option key={c.classId} value={c.classId}>
              {c.className}
            </option>
          ))}
        </select>
      </div>

      {!selectedClass ? (
        <EmptyState
          title="Pick your class"
          description="Select a class above to see the best equipment recommendations for your build, organized by act."
          icon={<Swords size={40} />}
        />
      ) : !classData ? (
        <EmptyState
          title="No data found"
          description="Something went wrong loading equipment for this class."
          icon={<Search size={40} />}
        />
      ) : (
        <>
          {/* Class header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(198,162,85,0.2), rgba(198,162,85,0.05))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--gold)',
              }}
            >
              {classData.className.charAt(0)}
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {classData.className}
              </h2>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  margin: 0,
                }}
              >
                {classData.categories.reduce((sum, cat) => sum + cat.items.length, 0)} gear recommendations
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative" style={{ marginBottom: 20 }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gold-dim)',
              }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter suggestions..."
              className="w-full"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                padding: '10px 14px 10px 40px',
              }}
            />
          </div>

          {/* Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredCategories.map((cat) => {
              const key = `${selectedClass}-${cat.category}`;
              const isOpen = expandedCategories[key] !== false; // default open
              const Icon = CATEGORY_ICONS[cat.category];
              const color = CATEGORY_COLORS[cat.category];

              return (
                <div
                  key={cat.category}
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '12px 16px',
                      background: 'transparent',
                      border: 'none',
                      borderLeft: `3px solid ${color}`,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${color}18`,
                          color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {CATEGORY_LABELS[cat.category]}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginLeft: 8,
                          }}
                        >
                          ({cat.items.length})
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      size={18}
                      style={{
                        color: 'var(--gold-dim)',
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>

                  {/* Items */}
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 16px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      {cat.items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--parchment)',
                            borderRadius: 12,
                            padding: '12px 14px',
                            borderTop: '1px solid var(--border-strong)',
                          }}
                        >
                          {/* Item name + badges */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 8,
                              marginBottom: 8,
                            }}
                          >
                            <h4
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: RARITY_COLORS[item.rarity] ?? 'var(--text-primary)',
                                margin: 0,
                                lineHeight: 1.3,
                              }}
                            >
                              {item.name}
                            </h4>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <Badge
                                label={`Act ${item.act}`}
                                color={ACT_COLORS[item.act]}
                              />
                            </div>
                          </div>

                          {/* Badges row */}
                          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                            <Badge
                              label={item.rarity}
                              color={RARITY_COLORS[item.rarity] ?? 'var(--text-secondary)'}
                            />
                          </div>

                          {/* Why */}
                          <p
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.5,
                              margin: '0 0 8px 0',
                            }}
                          >
                            {item.why}
                          </p>

                          {/* Location */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 6,
                              fontSize: '0.75rem',
                              color: 'var(--gold-dim)',
                            }}
                          >
                            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Location:</span>
                            <span style={{ lineHeight: 1.4 }}>{item.location}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredCategories.length === 0 && query && (
            <EmptyState
              title="No matches"
              description="Try a different search term."
              icon={<Search size={40} />}
            />
          )}
        </>
      )}
    </AppShell>
  );
}
