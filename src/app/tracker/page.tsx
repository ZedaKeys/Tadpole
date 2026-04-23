1|'use client';

export const metadata = { title: 'Tracker — Tadpole' };

import { useState, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Clock,
  Sword,
  Shield,
  Gem,
  FlaskConical,
  Package,
  ChevronDown,
  Play,
  Square,
  MapPin,
  Users,
  Coins,
  Trophy,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { BackButton } from '@/components/ui/BackButton';
import { usePersistedState } from '@/hooks/usePersistedState';

// ── Types ──────────────────────────────────────────────────────
type Rarity = 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary';
type Category = 'Weapons' | 'Armor' | 'Accessories' | 'Consumables' | 'Misc';

interface LootItem {
  id: string;
  name: string;
  category: Category;
  rarity: Rarity;
  act: number;
  timestamp: number;
  notes?: string;
}

interface Session {
  id: string;
  startTime: number;
  endTime: number | null;
  goldEarned: number;
  areasVisited: string[];
  partyMembers: string[];
  items: LootItem[];
}

// ── Constants ──────────────────────────────────────────────────
const CATEGORIES: Category[] = ['Weapons', 'Armor', 'Accessories', 'Consumables', 'Misc'];
const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'very rare', 'legendary'];
const ACTS = [1, 2, 3];

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  'very rare': '#a855f7',
  legendary: '#f59e0b',
};

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  Weapons: <Sword size={14} />,
  Armor: <Shield size={14} />,
  Accessories: <Gem size={14} />,
  Consumables: <FlaskConical size={14} />,
  Misc: <Package size={14} />,
};

const CATEGORY_COLORS: Record<Category, string> = {
  Weapons: '#ef4444',
  Armor: '#3b82f6',
  Accessories: '#a855f7',
  Consumables: '#22c55e',
  Misc: '#6b7280',
};

// ── Helpers ────────────────────────────────────────────────────
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function durationStr(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  if (hrs > 0) return `${hrs}h ${m}m`;
  return `${m}m`;
}

// ── Subcomponents ──────────────────────────────────────────────

function RarityBar({ items }: { items: LootItem[] }) {
  const counts: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, 'very rare': 0, legendary: 0 };
  items.forEach((i) => { counts[i.rarity]++; });

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {RARITIES.map((r) => {
        const c = counts[r];
        const col = RARITY_COLORS[r];
        return (
          <div
            key={r}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: `${col}15`,
              border: `1px solid ${col}30`,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: col,
              textTransform: 'capitalize' as const,
            }}
          >
            <span data-numeric style={{ fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' }}>{c}</span>
            <span>{r === 'very rare' ? 'V.Rare' : r}</span>
          </div>
        );
      })}
    </div>
  );
}

function CategoryFilter({
  active,
  onChange,
}: {
  active: Category | 'All';
  onChange: (c: Category | 'All') => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
      <button
        onClick={() => onChange('All')}
        className="btn"
        style={{
          minHeight: 36,
          minWidth: 'auto',
          padding: '6px 14px',
          fontSize: '0.75rem',
          whiteSpace: 'nowrap' as const,
          background: active === 'All' ? 'var(--accent)' : 'var(--surface-2)',
          color: active === 'All' ? '#0a0a0f' : 'var(--text)',
          border: `1px solid ${active === 'All' ? 'var(--accent)' : 'var(--border)'}`,
        }}
      >
        All
      </button>
      {CATEGORIES.map((cat) => {
        const isActive = active === cat;
        const col = CATEGORY_COLORS[cat];
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className="btn"
            style={{
              minHeight: 36,
              minWidth: 'auto',
              padding: '6px 12px',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap' as const,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: isActive ? `${col}25` : 'var(--surface-2)',
              color: isActive ? col : 'var(--text)',
              border: `1px solid ${isActive ? `${col}50` : 'var(--border)'}`,
            }}
          >
            {CATEGORY_ICONS[cat]}
            {cat}
          </button>
        );
      })}
    </div>
  );
}

function LootEntry({ item, onDelete }: { item: LootItem; onDelete: () => void }) {
  const col = RARITY_COLORS[item.rarity];
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${col}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {item.name}
          </span>
          <Badge label={item.rarity === 'very rare' ? 'V.Rare' : item.rarity} color={col} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: '0.7rem', color: CATEGORY_COLORS[item.category], display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            {CATEGORY_ICONS[item.category]} {item.category}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Act {item.act}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{formatTime(item.timestamp)}</span>
        </div>
        {item.notes && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2 }}>{item.notes}</div>
        )}
      </div>
      <button
        onClick={onDelete}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-dim)',
          cursor: 'pointer',
          padding: 8,
          minHeight: 44,
          minWidth: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Delete item"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function SessionHistory({
  sessions,
  onDelete,
}: {
  sessions: Session[];
  onDelete: (id: string) => void;
}) {
  const completed = sessions.filter((s) => s.endTime !== null).sort((a, b) => b.startTime - a.startTime);
  if (completed.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {completed.map((s) => {
        const dur = s.endTime! - s.startTime;
        return (
          <div
            key={s.id}
            style={{
              padding: 14,
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                {formatDate(s.startTime)}
              </span>
              <button
                onClick={() => onDelete(s.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Delete session"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' as const }}>
              <StatChip icon={<Clock size={12} />} value={durationStr(dur)} label="Duration" />
              <StatChip icon={<Sword size={12} />} value={s.items.length.toString()} label="Items" />
              <StatChip icon={<Coins size={12} />} value={s.goldEarned.toString()} label="Gold" />
              <StatChip icon={<MapPin size={12} />} value={s.areasVisited.length.toString()} label="Areas" />
            </div>
            {s.items.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' as const }}>
                {s.items.slice(0, 5).map((item) => (
                  <span
                    key={item.id}
                    style={{
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: `${RARITY_COLORS[item.rarity]}15`,
                      color: RARITY_COLORS[item.rarity],
                      border: `1px solid ${RARITY_COLORS[item.rarity]}25`,
                    }}
                  >
                    {item.name}
                  </span>
                ))}
                {s.items.length > 5 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', padding: '2px 4px' }}>
                    +{s.items.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatChip({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: '0.7rem',
        color: color ?? 'var(--text-dim)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span data-numeric style={{ fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: color ?? 'var(--text)' }}>{value}</span>
      <span>{label}</span>
    </div>
  );
}

// ── Quick add tag input ────────────────────────────────────────
function TagInput({
  label,
  placeholder,
  tags,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          ref={inputRef}
          className="input"
          placeholder={placeholder}
          style={{ flex: 1, minHeight: 40, fontSize: '0.8rem' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const v = e.currentTarget.value.trim();
              if (v) { onAdd(v); e.currentTarget.value = ''; }
            }
          }}
        />
        <button
          className="btn"
          style={{ minHeight: 40, padding: '0 14px' }}
          onClick={() => {
            const v = inputRef.current?.value.trim();
            if (v) { onAdd(v); if (inputRef.current) inputRef.current.value = ''; }
          }}
        >
          <Plus size={16} />
        </button>
      </div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' as const }}>
          {tags.map((t, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                fontSize: '0.7rem',
                color: 'var(--text)',
              }}
            >
              {t}
              <button
                onClick={() => onRemove(i)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────────
type Tab = 'tracker' | 'session' | 'history';

// ── Main Page ──────────────────────────────────────────────────
export default function TrackerPage() {
  const [sessions, setSessions] = usePersistedState<Session[]>('tracker-sessions', []);
  const [activeTab, setActiveTab] = useState<Tab>('tracker');

  // Current session state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentAct, setCurrentAct] = useState<number>(1);

  // Add item form
  const [itemName, setItemName] = useState('');
  const [itemRarity, setItemRarity] = useState<Rarity>('common');
  const [itemCategory, setItemCategory] = useState<Category>('Misc');
  const [itemNotes, setItemNotes] = useState('');

  // Session config
  const [goldInput, setGoldInput] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [party, setParty] = useState<string[]>([]);

  // Filter
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');

  // Derived
  const currentSession = sessions.find((s) => s.id === currentSessionId) ?? null;
  const allItems = currentSession?.items ?? [];
  const filteredItems =
    categoryFilter === 'All' ? allItems : allItems.filter((i) => i.category === categoryFilter);

  // ── Handlers ───────────────────────────────────────────────
  const startSession = useCallback(() => {
    const id = uid();
    const newSession: Session = {
      id,
      startTime: Date.now(),
      endTime: null,
      goldEarned: 0,
      areasVisited: [],
      partyMembers: [],
      items: [],
    };
    setSessions((prev) => [...prev, newSession]);
    setCurrentSessionId(id);
    setAreas([]);
    setParty([]);
    setGoldInput('');
  }, [setSessions]);

  const endSession = useCallback(() => {
    if (!currentSessionId) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, endTime: Date.now(), goldEarned: parseInt(goldInput) || 0, areasVisited: areas, partyMembers: party }
          : s,
      ),
    );
    setCurrentSessionId(null);
  }, [currentSessionId, goldInput, areas, party, setSessions]);

  const addItem = useCallback(() => {
    if (!itemName.trim() || !currentSessionId) return;
    const item: LootItem = {
      id: uid(),
      name: itemName.trim(),
      category: itemCategory,
      rarity: itemRarity,
      act: currentAct,
      timestamp: Date.now(),
      notes: itemNotes.trim() || undefined,
    };
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, items: [...s.items, item] } : s)),
    );
    setItemName('');
    setItemNotes('');
  }, [itemName, itemNotes, itemCategory, itemRarity, currentAct, currentSessionId, setSessions]);

  const deleteItem = useCallback(
    (itemId: string) => {
      if (!currentSessionId) return;
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s,
        ),
      );
    },
    [currentSessionId, setSessions],
  );

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    },
    [setSessions],
  );

  const exportSession = useCallback(() => {
    if (!currentSession) return;
    const lines: string[] = [];
    lines.push('=== LOOT TRACKER SESSION ===');
    lines.push(`Started: ${formatDate(currentSession.startTime)}`);
    if (currentSession.endTime) {
      lines.push(`Ended: ${formatDate(currentSession.endTime)}`);
      lines.push(`Duration: ${durationStr(currentSession.endTime - currentSession.startTime)}`);
    } else {
      lines.push('Status: Active');
    }
    lines.push(`Gold Earned: ${goldInput || '0'}`);
    if (areas.length > 0) lines.push(`Areas: ${areas.join(', ')}`);
    if (party.length > 0) lines.push(`Party: ${party.join(', ')}`);
    lines.push('');
    lines.push(`--- ITEMS (${currentSession.items.length}) ---`);
    const rarityCounts: Record<string, number> = {};
    currentSession.items.forEach((i) => {
      rarityCounts[i.rarity] = (rarityCounts[i.rarity] || 0) + 1;
    });
    RARITIES.forEach((r) => {
      if (rarityCounts[r]) lines.push(`  ${r}: ${rarityCounts[r]}`);
    });
    lines.push('');
    currentSession.items.forEach((item, idx) => {
      lines.push(`${idx + 1}. [${item.rarity.toUpperCase()}] ${item.name} (${item.category}) - Act ${item.act}`);
      if (item.notes) lines.push(`   Notes: ${item.notes}`);
    });
    const text = lines.join('\n');

    if (navigator.share) {
      navigator.share({ title: 'Loot Tracker Session', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }, [currentSession, goldInput, areas, party]);

  // ── Tabs config ──────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'tracker', label: 'Loot Log', icon: <Sword size={16} /> },
    { key: 'session', label: 'Session', icon: <Clock size={16} /> },
    { key: 'history', label: 'History', icon: <Trophy size={16} /> },
  ];

  // ── Render ──────────────────────────────────────────────────
  return (
    <AppShell title="Loot Tracker">
      <BackButton href="/games" label="Games" />

      {/* Session status bar */}
      <div
        style={{
          marginTop: 12,
          marginBottom: 12,
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          background: currentSession ? 'rgba(82, 183, 136, 0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${currentSession ? 'rgba(82, 183, 136, 0.2)' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: currentSession ? 'var(--success)' : 'var(--text-dim)',
              animation: currentSession ? 'pulse-live 2s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: currentSession ? 'var(--success)' : 'var(--text-dim)' }}>
            {currentSession ? `Session Active - ${allItems.length} items` : 'No active session'}
          </span>
        </div>
        {currentSession ? (
          <button
            onClick={endSession}
            className="btn btn-danger"
            style={{ minHeight: 36, padding: '6px 14px', fontSize: '0.75rem' }}
          >
            <Square size={14} /> End
          </button>
        ) : (
          <button
            onClick={startSession}
            className="btn btn-primary"
            style={{ minHeight: 36, padding: '6px 14px', fontSize: '0.75rem' }}
          >
            <Play size={14} /> Start
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 16,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-sm)',
          padding: 4,
          border: '1px solid var(--border)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '8px 4px',
                borderRadius: 8,
                border: 'none',
                background: isActive ? 'var(--surface-2)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-dim)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                minHeight: 40,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TRACKER TAB ───────────────────────────────────────── */}
      {activeTab === 'tracker' && (
        <div>
          {!currentSession ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-dim)',
              }}
            >
              <Sword size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>Start a session to begin tracking loot</p>
            </div>
          ) : (
            <>
              {/* Quick Add */}
              <div
                style={{
                  padding: 14,
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    className="input"
                    placeholder="Item name..."
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
                    style={{ flex: 1, minHeight: 44, fontSize: '0.875rem' }}
                  />
                  <button
                    onClick={addItem}
                    className="btn btn-primary"
                    style={{ minHeight: 44, padding: '0 16px' }}
                    disabled={!itemName.trim()}
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Category selector */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {CATEGORIES.map((cat) => {
                    const isActive = itemCategory === cat;
                    const col = CATEGORY_COLORS[cat];
                    return (
                      <button
                        key={cat}
                        onClick={() => setItemCategory(cat)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: `1px solid ${isActive ? `${col}50` : 'var(--border)'}`,
                          background: isActive ? `${col}18` : 'transparent',
                          color: isActive ? col : 'var(--text-dim)',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          minHeight: 32,
                        }}
                      >
                        {CATEGORY_ICONS[cat]}
                      </button>
                    );
                  })}
                </div>

                {/* Rarity + Act row */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={itemRarity}
                    onChange={(e) => setItemRarity(e.target.value as Rarity)}
                    style={{
                      flex: 1,
                      minHeight: 36,
                      padding: '4px 10px',
                      borderRadius: 8,
                      background: 'var(--surface-2)',
                      border: `1px solid ${RARITY_COLORS[itemRarity]}40`,
                      color: RARITY_COLORS[itemRarity],
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      appearance: 'none' as const,
                    }}
                  >
                    {RARITIES.map((r) => (
                      <option key={r} value={r} style={{ background: '#1a1a26', color: '#e8e8ef' }}>
                        {r === 'very rare' ? 'Very Rare' : r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={currentAct}
                    onChange={(e) => setCurrentAct(Number(e.target.value))}
                    style={{
                      width: 80,
                      minHeight: 36,
                      padding: '4px 10px',
                      borderRadius: 8,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--gold)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      appearance: 'none' as const,
                    }}
                  >
                    {ACTS.map((a) => (
                      <option key={a} value={a} style={{ background: '#1a1a26', color: '#e8e8ef' }}>
                        Act {a}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional notes */}
                <input
                  className="input"
                  placeholder="Notes (optional)"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  style={{ marginTop: 8, minHeight: 36, fontSize: '0.75rem' }}
                />
              </div>

              {/* Category filter */}
              <div style={{ marginBottom: 12 }}>
                <CategoryFilter active={categoryFilter} onChange={setCategoryFilter} />
              </div>

              {/* Rarity breakdown */}
              {allItems.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <RarityBar items={allItems} />
                </div>
              )}

              {/* Item list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    {allItems.length === 0 ? 'Add your first item above' : 'No items in this category'}
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <LootEntry key={item.id} item={item} onDelete={() => deleteItem(item.id)} />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SESSION TAB ────────────────────────────────────────── */}
      {activeTab === 'session' && (
        <div>
          {!currentSession ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
              <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>No active session to configure</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Session stats summary */}
              <div
                style={{
                  padding: 14,
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                  Session Stats
                </h3>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
                  <StatChip icon={<Clock size={14} />} value={durationStr(Date.now() - currentSession.startTime)} label="elapsed" color="var(--accent)" />
                  <StatChip icon={<Sword size={14} />} value={allItems.length.toString()} label="items" color="var(--success)" />
                  <StatChip icon={<MapPin size={14} />} value={areas.length.toString()} label="areas" color="var(--warning)" />
                  <StatChip icon={<Users size={14} />} value={party.length.toString()} label="party" color="#a855f7" />
                </div>
              </div>

              {/* Gold earned */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                  Gold Earned
                </label>
                <div style={{ position: 'relative' }}>
                  <Coins
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--gold)',
                    }}
                  />
                  <input
                    className="input"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={goldInput}
                    onChange={(e) => setGoldInput(e.target.value)}
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </div>

              {/* Areas visited */}
              <TagInput
                label="Areas Visited"
                placeholder="Add area..."
                tags={areas}
                onAdd={(v) => setAreas((p) => [...p, v])}
                onRemove={(i) => setAreas((p) => p.filter((_, idx) => idx !== i))}
              />

              {/* Party members */}
              <TagInput
                label="Party Members"
                placeholder="Add member..."
                tags={party}
                onAdd={(v) => setParty((p) => [...p, v])}
                onRemove={(i) => setParty((p) => p.filter((_, idx) => idx !== i))}
              />

              {/* Export button */}
              <button
                onClick={exportSession}
                className="btn"
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  marginTop: 4,
                }}
              >
                <Download size={16} />
                Export Session
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div>
          {sessions.filter((s) => s.endTime !== null).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
              <Trophy size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>No completed sessions yet</p>
              <p style={{ fontSize: '0.75rem', marginTop: 4 }}>End a session to see it here</p>
            </div>
          ) : (
            <SessionHistory sessions={sessions} onDelete={deleteSession} />
          )}
        </div>
      )}
    </AppShell>
  );
}
