1|'use client';

export const metadata = { title: 'Tadpole — BG3 Live Companion' };

import { useState, useEffect, useMemo } from 'react';
import { useGameConnection } from '@/hooks/useGameConnection';
import { safeStr } from '@/lib/safe-cast';

import { useWidgetConfig } from '@/hooks/useWidgetConfig';

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
    // Hook error — use defaults
  }
  return {
    widgets: DEFAULT_WIDGET_ORDER,
    hidden: [],
    toggle: (_id: string) => {},
    reorder: (_from: number, _to: number) => {},
    showAll: () => {},
    resetToDefault: () => {},
  };
}

import {
  Swords, Wifi, WifiOff, Shield, MessageSquare, Cloud,
  Search, Map, SlidersHorizontal, X, Compass,
  Eye, EyeOff, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

// Widget component imports
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

/* ── Widget ID → Component mapping ── */
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

export default function HomePage() {
  const { gameState, isConnected, connectionStatus, disconnect, connect, getLastHost } = useGameConnection();
  const { widgets, hidden, toggle, reorder, showAll, resetToDefault } = useWidgetConfigSafe();
  const [ip, setIp] = useState(() => getLastHost() || '');
  const [connecting, setConnecting] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Auto-connect to the host serving this page
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

  /* ── Connection Screen ── */
  if (!isConnected || !gameState) {
    const isConnecting = connectionStatus === 'connecting' || connecting;
    return (
      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
        padding: '0 24px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '100dvh',
      }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {/* Shield icon with gold glow */}
          <div style={{
            width: 88,
            height: 88,
            margin: '0 auto 24px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, rgba(198,162,85,0.18), rgba(198,162,85,0.02))',
            border: '2px solid rgba(198,162,85,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(198,162,85,0.12), inset 0 0 20px rgba(198,162,85,0.06)',
          }}>
            <Shield size={38} style={{ color: '#c6a255', filter: 'drop-shadow(0 0 10px rgba(198,162,85,0.5))' }} />
          </div>

          <h1 style={{
            fontSize: 34,
            fontWeight: 700,
            color: '#e2e0d8',
            letterSpacing: '0.04em',
            marginBottom: 6,
            textShadow: '0 0 24px rgba(198,162,85,0.18)',
          }}>
            Tadpole
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 0,
          }}>
            BG3 Live Companion
          </p>

          {/* Decorative line */}
          <div style={{
            width: 60,
            height: 2,
            margin: '16px auto 0',
            background: 'linear-gradient(90deg, transparent, rgba(198,162,85,0.4), transparent)',
            borderRadius: 1,
          }} />
        </div>

        {/* Connection card */}
        <div style={{
          background: 'rgba(26,26,38,0.8)',
          borderRadius: 20,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}>
          {/* Status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
            padding: '8px 12px',
            borderRadius: 10,
            background: isConnecting
              ? 'rgba(198,162,85,0.08)'
              : isConnected
                ? 'rgba(82,183,136,0.08)'
                : 'rgba(255,255,255,0.02)',
          }}>
            {isConnecting ? (
              <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '2px solid rgba(198,162,85,0.3)',
                borderTopColor: '#c6a255',
                animation: 'spin 0.8s linear infinite',
              }} />
            ) : isConnected ? (
              <Wifi size={18} style={{ color: '#52b788' }} />
            ) : (
              <WifiOff size={18} style={{ color: '#6b7280' }} />
            )}
            <span style={{
              fontSize: 13,
              color: isConnecting ? '#c6a255' : '#9ca3af',
              fontWeight: 500,
            }}>
              {isConnecting ? 'Establishing link...' : isConnected ? 'Connected — awaiting data' : 'Not connected'}
            </span>
          </div>

          {/* IP input row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.x"
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.3)',
                color: '#e2e0d8',
                fontSize: 15,
                padding: '0 16px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(198,162,85,0.3)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            <button
              onClick={() => setIp('tadpole.local')}
              disabled={connecting}
              style={{
                height: 48,
                padding: '0 14px',
                borderRadius: 12,
                border: '1px solid rgba(198,162,85,0.2)',
                background: 'rgba(198,162,85,0.06)',
                color: '#c6a255',
                fontSize: 12,
                fontWeight: 600,
                cursor: connecting ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              Auto
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 16, lineHeight: 1.4 }}>
            Enter your Steam Deck IP or tap Auto to discover via mDNS
          </p>

          {/* Connect button */}
          <button
            onClick={handleConnect}
            disabled={connecting || !ip.trim()}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 12,
              border: 'none',
              background: (connecting || !ip.trim())
                ? 'rgba(198,162,85,0.15)'
                : 'linear-gradient(135deg, #c6a255 0%, #d4b56a 50%, #c6a255 100%)',
              color: (connecting || !ip.trim()) ? '#666' : '#0d0c1d',
              fontSize: 15,
              fontWeight: 700,
              cursor: (connecting || !ip.trim()) ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: (!connecting && ip.trim()) ? '0 4px 20px rgba(198,162,85,0.25)' : 'none',
              transition: 'all 0.3s ease',
              letterSpacing: '0.02em',
            }}
          >
            <Wifi size={16} />
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>

        {/* Quick links */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          marginTop: 20,
          flexWrap: 'wrap',
        }}>
          <Link
            href="/browse"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 20,
              background: 'rgba(198,162,85,0.06)',
              border: '1px solid rgba(198,162,85,0.15)',
              color: '#c6a255',
              fontSize: 13,
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'background-color 0.2s, border-color 0.2s',
            }}
          >
            <Compass size={14} />
            Browse
          </Link>
          <Link
            href="/map"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 20,
              background: 'rgba(198,162,85,0.06)',
              border: '1px solid rgba(198,162,85,0.15)',
              color: '#c6a255',
              fontSize: 13,
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'background-color 0.2s, border-color 0.2s',
            }}
          >
            <Map size={14} />
            World Map
          </Link>
          <Link
            href="/search"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 13,
              textDecoration: 'none',
              transition: 'background-color 0.2s, border-color 0.2s',
            }}
          >
            <Search size={14} />
            Search
          </Link>
        </div>

        {/* Bottom note */}
        <p style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 11,
          color: '#4b5563',
          letterSpacing: '0.03em',
        }}>
          Steam Deck + BG3 Script Extender required
        </p>
      </div>
    );
  }

  /* ── Connected Dashboard ── */
  const visibleWidgets = widgets.filter((id: string) => WIDGET_MAP[id]);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', width: '100%', padding: '16px 16px 0', position: 'relative' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 8,
      }}>
        {/* LIVE indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#52b788',
            boxShadow: '0 0 8px rgba(82,183,136,0.5)',
          }} />
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#52b788',
            letterSpacing: '0.08em',
          }}>
            LIVE
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setCustomizerOpen(true)}
            style={{
              height: 36,
              width: 36,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Customize widgets"
          >
            <SlidersHorizontal size={16} />
          </button>
          <button
            onClick={disconnect}
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Area + Status pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: '#e8e8ef' }}>
          {safeStr(gameState.areaName || gameState.area) || 'Unknown'}
        </span>
        {gameState.inCombat && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            borderRadius: 20,
            background: 'rgba(231,111,81,0.12)',
            color: '#e76f51',
            fontSize: 12,
            fontWeight: 600,
          }}>
            <Swords size={12} /> COMBAT
          </span>
        )}
        {gameState.inDialog && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            borderRadius: 20,
            background: 'rgba(198,162,85,0.12)',
            color: '#c6a255',
            fontSize: 12,
            fontWeight: 600,
          }}>
            <MessageSquare size={12} /> DIALOG
          </span>
        )}
        {gameState.weather && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            borderRadius: 20,
            background: 'rgba(72,191,227,0.12)',
            color: '#48bfe3',
            fontSize: 12,
            fontWeight: 600,
          }}>
            <Cloud size={12} /> {safeStr(gameState.weather)}
          </span>
        )}
      </div>

      {/* Browse Encyclopedia link */}
      <Link
        href="/browse"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(198,162,85,0.06) 0%, rgba(139,92,246,0.04) 100%)',
          border: '1px solid rgba(198,162,85,0.12)',
          marginBottom: 12,
          textDecoration: 'none',
          transition: 'background 0.2s, border-color 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(198,162,85,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Compass size={16} style={{ color: '#c6a255' }} />
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e0d8' }}>Browse Encyclopedia</span>
            <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Spells, items, builds, quests & more</span>
          </div>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</span>
      </Link>

      {/* Widget Grid */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingBottom: 72,
      }}>
        {visibleWidgets.map((id: string) => {
          const WidgetComponent = WIDGET_MAP[id];
          if (!WidgetComponent) return null;
          return <WidgetComponent key={id} gameState={gameState} />;
        })}
      </div>

      {/* Widget Customizer Overlay */}
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

/* ── Widget Customizer Overlay ── */
function WidgetCustomizer({
  widgets,
  hidden,
  toggle,
  reorder,
  showAll,
  resetToDefault,
  onClose,
}: {
  widgets: string[];
  hidden: string[];
  toggle: (id: string) => void;
  reorder: (fromIdx: number, toIdx: number) => void;
  showAll: () => void;
  resetToDefault: () => void;
  onClose: () => void;
}) {
  const allKnown = Object.keys(WIDGET_MAP);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Build full list: visible (in order) + hidden
  const visibleSet = new Set(widgets);
  const hiddenWidgets = allKnown.filter(id => !visibleSet.has(id));
  const orderedList = [...widgets.filter(id => allKnown.includes(id)), ...hiddenWidgets];

  const isVisible = (id: string) => visibleSet.has(id);

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    reorder(idx, idx - 1);
  };
  const moveDown = (idx: number) => {
    // Only within visible widgets range
    if (idx >= widgets.filter(id => allKnown.includes(id)).length - 1) return;
    reorder(idx, idx + 1);
  };

  const visibleCount = widgets.filter(id => allKnown.includes(id)).length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#12121a',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '85vh',
          overflow: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.15)',
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px 12px',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e8e8ef', margin: 0 }}>
            Customize Widgets
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px' }}>
          <button
            onClick={showAll}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Show All
          </button>
          <button
            onClick={resetToDefault}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid rgba(198,162,85,0.15)',
              background: 'rgba(198,162,85,0.06)',
              color: '#c6a255',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reset Default
          </button>
        </div>

        {/* Widget list */}
        <div style={{ padding: '0 20px' }}>
          {orderedList.map((id, idx) => {
            const visible = isVisible(id);
            const inVisibleRange = idx < visibleCount;
            return (
              <div
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  opacity: visible ? 1 : 0.45,
                }}
              >
                {/* Grip / Reorder (only for visible) */}
                {inVisibleRange ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <button
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                        cursor: idx === 0 ? 'default' : 'pointer',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveDown(idx)}
                      disabled={idx === visibleCount - 1}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: idx === visibleCount - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                        cursor: idx === visibleCount - 1 ? 'default' : 'pointer',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: 14 }} />
                )}

                {/* Label */}
                <span style={{
                  flex: 1,
                  fontSize: 14,
                  color: '#e8e8ef',
                  fontWeight: 500,
                }}>
                  {WIDGET_LABELS[id] || id}
                </span>

                {/* Toggle visibility */}
                <button
                  onClick={() => toggle(id)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: 'none',
                    background: visible ? 'rgba(198,162,85,0.12)' : 'rgba(255,255,255,0.04)',
                    color: visible ? '#c6a255' : 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom spacer */}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
