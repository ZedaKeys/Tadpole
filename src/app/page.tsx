'use client';

import { useState, useEffect } from 'react';
import { useGameConnection } from '@/hooks/useGameConnection';
import { safeStr } from '@/lib/safe-cast';
import { useWidgetConfig } from '@/hooks/useWidgetConfig';
import {
  Swords, Wifi, WifiOff, Shield,
  Search, Map, SlidersHorizontal, X,
  Compass, MessageSquare, Cloud,
  ChevronDown, ChevronUp, Eye, EyeOff,
} from 'lucide-react';
import Link from 'next/link';

import CharacterOverview from '@/components/widgets/CharacterOverview';
import PartyHealth from '@/components/widgets/PartyHealth';
import XpProgress from '@/components/widgets/XpProgress';
import GoldResources from '@/components/widgets/GoldResources';
import CombatStatus from '@/components/widgets/CombatStatus';
import EncumbranceWidget from '@/components/widgets/EncumbranceWidget';
import SpellSlotsWidget from '@/components/widgets/SpellSlotsWidget';
import ConditionsPanel from '@/components/widgets/ConditionsPanel';
import DeathSavesWidget from '@/components/widgets/DeathSavesWidget';
import CampSuppliesWidget from '@/components/widgets/CampSuppliesWidget';
import StealthVisionWidget from '@/components/widgets/StealthVisionWidget';
import CharacterFlagsWidget from '@/components/widgets/CharacterFlagsWidget';
import SessionTimelineWidget from '@/components/widgets/SessionTimelineWidget';

import type { GameState } from '@/types';

const DEFAULT_WIDGET_ORDER = [
  'character', 'partyHealth', 'combatStatus', 'xpProgress',
  'goldResources', 'spellSlots', 'conditions', 'campSupplies',
  'encumbrance', 'deathSaves', 'stealthVision', 'characterFlags',
  'sessionTimeline',
];

function useWidgetConfigSafe() {
  try {
    return useWidgetConfig();
  } catch {
    return {
      widgets: DEFAULT_WIDGET_ORDER,
      hidden: [] as string[],
      toggle: (_id: string) => {},
      reorder: (_from: number, _to: number) => {},
      showAll: () => {},
      resetToDefault: () => {},
    };
  }
}

const WIDGET_MAP: Record<string, React.ComponentType<{ gameState: GameState }>> = {
  character: CharacterOverview,
  partyHealth: PartyHealth,
  xpProgress: XpProgress,
  goldResources: GoldResources,
  combatStatus: CombatStatus,
  encumbrance: EncumbranceWidget,
  spellSlots: SpellSlotsWidget,
  conditions: ConditionsPanel,
  deathSaves: DeathSavesWidget,
  campSupplies: CampSuppliesWidget,
  stealthVision: StealthVisionWidget,
  characterFlags: CharacterFlagsWidget,
  sessionTimeline: SessionTimelineWidget,
};

const WIDGET_LABELS: Record<string, string> = {
  character: 'Character',
  partyHealth: 'Party Health',
  xpProgress: 'XP Progress',
  goldResources: 'Gold & Resources',
  combatStatus: 'Combat Status',
  encumbrance: 'Encumbrance',
  spellSlots: 'Spell Slots',
  conditions: 'Conditions',
  deathSaves: 'Death Saves',
  campSupplies: 'Camp Supplies',
  stealthVision: 'Stealth & Vision',
  characterFlags: 'Character Flags',
  sessionTimeline: 'Session Timeline',
};

const quickLinks = [
  { href: '/browse',  icon: Compass, label: 'Browse' },
  { href: '/map',    icon: Map,    label: 'World Map' },
  { href: '/search', icon: Search, label: 'Search' },
];

/* ── Connection Screen ──────────────────────────────────────────── */
function ConnectionScreen({
  ip, setIp, connecting, handleConnect,
}: {
  ip: string; setIp: (v: string) => void;
  connecting: boolean; handleConnect: () => void;
}) {
  return (
    <div className="connect-screen">
      <div className="connect-icon">
        <Shield size={28} strokeWidth={1.5} />
      </div>

      <h1 className="connect-title">Tadpole</h1>
      <p className="connect-subtitle">BG3 companion for your Steam Deck</p>

      <div className="connect-form">
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="Steam Deck IP"
          className="input"
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          aria-label="Steam Deck IP address"
        />
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting || !ip.trim()}
          className="btn btn-primary"
        >
          <Wifi size={17} />
          {connecting ? 'Connecting...' : 'Connect'}
        </button>
      </div>

      <nav style={{ display: 'flex', gap: 16, marginTop: 32 }} aria-label="Quick links">
        {quickLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: 'var(--text-3)',
              fontSize: '0.8rem',
            }}
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </nav>

      <p className="connect-hint" style={{ marginTop: 24 }}>
        Requires Steam Deck + BG3 Script Extender
      </p>
    </div>
  );
}

/* ── Widget Customizer ───────────────────────────────────────────── */
function WidgetCustomizer({
  widgets, hidden, toggle, reorder, showAll, resetToDefault, onClose,
}: {
  widgets: string[]; hidden: string[];
  toggle: (id: string) => void;
  reorder: (from: number, to: number) => void;
  showAll: () => void; resetToDefault: () => void;
  onClose: () => void;
}) {
  const allKnown = Object.keys(WIDGET_MAP);
  const visibleSet = new Set(widgets);
  const visibleCount = widgets.filter(id => allKnown.includes(id)).length;
  const hiddenWidgets = allKnown.filter(id => !visibleSet.has(id));
  const orderedList = [...widgets.filter(id => allKnown.includes(id)), ...hiddenWidgets];

  const isVisible = (id: string) => visibleSet.has(id);
  const moveUp = (idx: number) => { if (idx > 0) reorder(idx, idx - 1); };
  const moveDown = (idx: number) => {
    if (idx < visibleCount - 1) reorder(idx, idx + 1);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderBottom: 0,
          borderRadius: '24px 24px 0 0',
          padding: '12px 16px 24px',
          maxHeight: '86vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{
          width: 46, height: 5, borderRadius: 999, background: 'var(--border)',
          margin: '0 auto 14px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '0 0 2px' }}>Layout</p>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Widgets</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: '4px 0 0' }}>
              {visibleCount} visible · {hidden.filter(id => allKnown.includes(id)).length} hidden
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={showAll} className="btn btn-ghost btn-sm">Show all</button>
          <button onClick={resetToDefault} className="btn btn-sm">Reset</button>
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {orderedList.map((id, idx) => {
            const visible = isVisible(id);
            const inVisibleRange = idx < visibleCount;
            return (
              <div
                key={id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  background: 'var(--surface-2)',
                  opacity: visible ? 1 : 0.45,
                }}
              >
                {inVisibleRange ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <button
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      style={{ width: 28, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)', cursor: 'pointer', fontSize: 11 }}
                      aria-label="Move up"
                    >▲</button>
                    <button
                      onClick={() => moveDown(idx)}
                      disabled={idx === visibleCount - 1}
                      style={{ width: 28, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)', cursor: 'pointer', fontSize: 11 }}
                      aria-label="Move down"
                    >▼</button>
                  </div>
                ) : <div style={{ width: 56 }} />}

                <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                  {WIDGET_LABELS[id] || id}
                </span>

                <button
                  onClick={() => toggle(id)}
                  style={{
                    width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 12, border: '1px solid var(--border)',
                    background: visible ? 'rgba(91,138,255,0.1)' : 'transparent',
                    color: visible ? 'var(--accent)' : 'var(--text-3)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  aria-label={visible ? 'Hide' : 'Show'}
                >
                  {visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function HomePage() {
  const { gameState, isConnected, connectionStatus, disconnect, connect, getLastHost } = useGameConnection();
  const { widgets, hidden, toggle, reorder, showAll, resetToDefault } = useWidgetConfigSafe();
  const [ip, setIp] = useState(() => getLastHost() || '');
  const [connecting, setConnecting] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  useEffect(() => {
    if (isConnected || connecting) return;
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return;
    const savedHost = getLastHost();
    const autoConnectHost = (savedHost && savedHost === hostname) ? savedHost : hostname;
    if (autoConnectHost) {
      setIp(autoConnectHost);
      connect(autoConnectHost, 3456);
    }
  }, [isConnected, connecting, getLastHost, connect]);

  const handleConnect = () => {
    if (!ip.trim()) return;
    setConnecting(true);
    connect(ip.trim(), 3456);
  };

  useEffect(() => {
    if (connecting && isConnected) setConnecting(false);
  }, [connecting, isConnected]);

  if (!isConnected || !gameState) {
    return <ConnectionScreen ip={ip} setIp={setIp} connecting={connecting || connectionStatus === 'connecting'} handleConnect={handleConnect} />;
  }

  const visibleWidgets = widgets.filter((id: string) => WIDGET_MAP[id]);
  const areaName = safeStr(gameState.areaName || gameState.area) || 'Unknown Area';

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 100px' }}>
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-area-name">{areaName}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setCustomizerOpen(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: 'none', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-2)', cursor: 'pointer' }}
            aria-label="Customize widgets"
          >
            <SlidersHorizontal size={17} />
          </button>
          <button onClick={disconnect} className="btn btn-ghost btn-sm">
            <WifiOff size={14} />
            Disconnect
          </button>
        </div>
      </div>

      {/* Status row */}
      <div className="dash-status-row">
        <span className="chip chip-success">
          <Wifi size={12} /> Connected
        </span>
        {gameState.inCombat && (
          <span className="chip chip-danger">
            <Swords size={12} /> Combat
          </span>
        )}
        {gameState.inDialog && (
          <span className="chip chip-accent">
            <MessageSquare size={12} /> Dialog
          </span>
        )}
        {gameState.weather && (
          <span className="chip chip-muted">
            <Cloud size={12} /> {safeStr(gameState.weather)}
          </span>
        )}
      </div>

      {/* Encyclopedia card */}
      <Link
        href="/browse"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          border: '1px solid var(--border)',
          borderRadius: 12,
          background: 'var(--surface)',
          marginBottom: 16,
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: 40, height: 40, display: 'grid', placeItems: 'center',
          borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)',
          color: 'var(--accent)', flexShrink: 0,
        }}>
          <Compass size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '0 0 2px', fontFamily: 'monospace' }}>Reference</p>
          <strong style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>Browse Encyclopedia</strong>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: '2px 0 0' }}>Spells, items, builds, quests</p>
        </div>
        <span style={{ color: 'var(--text-3)', fontSize: '1.1rem' }}>›</span>
      </Link>

      {/* Widgets */}
      {visibleWidgets.map((id: string) => {
        const WidgetComponent = WIDGET_MAP[id];
        if (!WidgetComponent) return null;
        return (
          <div key={id} className="widget-shell">
            <WidgetComponent gameState={gameState} />
          </div>
        );
      })}

      {customizerOpen && (
        <WidgetCustomizer
          widgets={widgets}
          hidden={hidden}
          toggle={toggle}
          reorder={reorder}
          showAll={showAll}
          resetToDefault={resetToDefault}
          onClose={() => setCustomizerOpen(false)}
        />
      )}
    </div>
  );
}