'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGameConnection } from '@/hooks/useGameConnection';
import type { GameEvent } from '@/types';
import {
  MapPin, Swords, WifiOff, Shield, Heart, Zap, AlertTriangle,
  ArrowLeft, Sword, Flame, Skull, Sparkles, MessageSquare,
  Users, ArrowRightLeft, TrendingUp, Star, ShieldCheck,
  Bed, Coffee, Eye, Timer, ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

/* ── Category system ── */
type EventCategory = 'combat' | 'healing' | 'spells' | 'status' | 'misc';

const CATEGORY_COLORS: Record<EventCategory, string> = {
  combat: '#e76f51',
  healing: '#52b788',
  spells: '#48bfe3',
  status: '#f4a261',
  misc: 'rgba(255,255,255,0.4)',
};

const CATEGORY_ICONS: Record<EventCategory, React.ReactNode> = {
  combat: <Sword size={14} />,
  healing: <Heart size={14} />,
  spells: <Zap size={14} />,
  status: <Shield size={14} />,
  misc: <Eye size={14} />,
};

function getEventCategory(type: string): EventCategory {
  const t = type.toLowerCase();
  if (t.includes('combat') || t.includes('damage') || t.includes('attack') || t.includes('kill') || t.includes('died') || t.includes('crit'))
    return 'combat';
  if (t.includes('heal') || t.includes('rest') || t.includes('reviv'))
    return 'healing';
  if (t.includes('spell') || t.includes('cast') || t.includes('concentration'))
    return 'spells';
  if (t.includes('status') || t.includes('condition') || t.includes('level_up') || t.includes('dialog') || t.includes('approval'))
    return 'status';
  return 'misc';
}

/* ── Specific event type → icon override ── */
function getEventIcon(type: string): React.ReactNode {
  const t = type.toLowerCase();
  if (t.includes('combat_entered')) return <Swords size={14} />;
  if (t.includes('combat_exited')) return <ShieldCheck size={14} />;
  if (t.includes('damage') || t.includes('attack')) return <Flame size={14} />;
  if (t.includes('kill') || t.includes('died')) return <Skull size={14} />;
  if (t.includes('crit')) return <Star size={14} />;
  if (t.includes('heal')) return <Heart size={14} />;
  if (t.includes('rest')) return t.includes('long') ? <Bed size={14} /> : <Coffee size={14} />;
  if (t.includes('reviv')) return <Sparkles size={14} />;
  if (t.includes('spell') || t.includes('cast')) return <Zap size={14} />;
  if (t.includes('dialog')) return <MessageSquare size={14} />;
  if (t.includes('approval')) return <Star size={14} />;
  if (t.includes('party')) return <Users size={14} />;
  if (t.includes('level') && t.includes('started')) return <ArrowRightLeft size={14} />;
  if (t.includes('level') && t.includes('stopped')) return <ArrowRightLeft size={14} />;
  if (t.includes('level_up')) return <TrendingUp size={14} />;
  if (t.includes('session')) return <Timer size={14} />;
  // fallback to category icon
  return CATEGORY_ICONS[getEventCategory(type)];
}

function getEventColor(type: string): string {
  return CATEGORY_COLORS[getEventCategory(type)];
}

function getEventLabel(type: string): string {
  const labels: Record<string, string> = {
    session_loaded: 'Session Started',
    level_gameplay_started: 'Entered Area',
    level_gameplay_stopped: 'Left Area',
    combat_entered: 'Combat Started',
    combat_exited: 'Combat Ended',
    dialog_entered: 'Dialog Started',
    dialog_exited: 'Dialog Ended',
    long_rest: 'Long Rest',
    short_rest: 'Short Rest',
    party_member_joined: 'Party Member Joined',
    party_member_removed: 'Party Member Left',
    level_up: 'Level Up',
    character_died: 'Character Died',
    character_revived: 'Character Revived',
    approval_changed: 'Approval Changed',
    damage_dealt: 'Damage Dealt',
    damage_taken: 'Damage Taken',
    healing_received: 'Healing Received',
    spell_cast: 'Spell Cast',
    critical_hit: 'Critical Hit',
    saving_throw: 'Saving Throw',
    status_applied: 'Status Applied',
    status_removed: 'Status Removed',
    kill: 'Enemy Killed',
    concentration_broken: 'Concentration Broken',
  };
  return labels[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/* ── Grouped event interface ── */
interface EventGroup {
  type: string;
  category: EventCategory;
  events: GameEvent[];
  latestTimestamp: number;
}

function groupEvents(events: GameEvent[]): EventGroup[] {
  if (events.length === 0) return [];

  const groups: EventGroup[] = [];
  let currentGroup: EventGroup | null = null;

  for (const event of events) {
    const cat = getEventCategory(event.type);
    if (currentGroup && currentGroup.type === event.type) {
      currentGroup.events.push(event);
      if (event.timestamp > currentGroup.latestTimestamp) {
        currentGroup.latestTimestamp = event.timestamp;
      }
    } else {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = {
        type: event.type,
        category: cat,
        events: [event],
        latestTimestamp: event.timestamp,
      };
    }
  }
  if (currentGroup) groups.push(currentGroup);
  return groups;
}

/* ── Time formatting ── */
function formatRelative(timestamp: number, now: number): string {
  if (timestamp <= 0) return '';
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function getHpColor(hp: number, maxHp: number): string {
  const safeHp = typeof hp === 'number' ? hp : 0;
  const safeMax = typeof maxHp === 'number' ? maxHp : 1;
  const pct = safeMax > 0 ? safeHp / safeMax : 0;
  if (pct > 0.5) return '#52b788';
  if (pct > 0.25) return '#f4a261';
  return '#e76f51';
}

/** Ensure a value is a renderable primitive (string/number/boolean/null/undefined).
 *  Prevents React error #310 "Objects are not valid as a React child". */
function safeStr(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
  return '';
}

/* ── Main component ── */
export default function FeedPage() {
  const { gameState, isConnected } = useGameConnection();
  const [now, setNow] = useState(Date.now());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Tick every second for relative times
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Event counts by category for filter pills (MUST be before early return — hooks order must be stable)
  const allEventsForCounts = gameState?.events || [];
  const categoryCounts = useMemo(() => {
    const counts: Record<EventCategory, number> = { combat: 0, healing: 0, spells: 0, status: 0, misc: 0 };
    for (const e of allEventsForCounts) counts[getEventCategory(e.type)]++;
    return counts;
  }, [allEventsForCounts]);

  // Not connected — show prompt
  if (!isConnected || !gameState) {
    return (
      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60dvh',
        gap: 16,
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(198,162,85,0.08)',
          border: '1px solid rgba(198,162,85,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <WifiOff size={28} style={{ color: 'rgba(255,255,255,0.25)' }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e8e8ef', margin: 0 }}>
          Not Connected
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Connect to your BG3 game to see the live event feed.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #c6a255 0%, #d4b56a 50%, #c6a255 100%)',
            color: '#0d0c1d',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(198,162,85,0.25)',
            marginTop: 8,
          }}
        >
          <ArrowLeft size={16} />
          Go to Home
        </Link>
      </div>
    );
  }

  const host = gameState.host;
  const allEvents = gameState.events || [];
  // Show all events, newest first
  const reversedEvents = [...allEvents].reverse();
  const groups = groupEvents(reversedEvents);

  // Last updated timestamp
  const latestTs = allEvents.length > 0 ? allEvents[allEvents.length - 1].timestamp : gameState.timestamp;
  const lastUpdatedSec = latestTs > 0 ? Math.max(0, Math.floor((now - latestTs) / 1000)) : 0;

  // categoryCounts moved above early return for stable hook order
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', width: '100%', padding: '16px 16px 72px' }}>
      {/* Header with last updated */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e8e8ef', margin: 0 }}>
            Event Feed
          </h1>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 20,
            background: 'rgba(82,183,136,0.08)',
            border: '1px solid rgba(82,183,136,0.12)',
          }}>
            <span style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#52b788',
              boxShadow: '0 0 4px rgba(82,183,136,0.5)',
            }} />
            <span style={{ fontSize: 10, color: '#52b788', fontWeight: 600, letterSpacing: '0.05em' }}>
              LIVE
            </span>
          </span>
        </div>
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
          textDecoration: 'none',
          minHeight: 44,
          paddingLeft: 8,
        }}>
          <ArrowLeft size={14} />
          Home
        </Link>
      </div>

      {/* Last updated bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        padding: '6px 10px',
        borderRadius: 10,
        background: 'rgba(198,162,85,0.04)',
        border: '1px solid rgba(198,162,85,0.08)',
      }}>
        <Timer size={12} style={{ color: '#c6a255' }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          Last updated {lastUpdatedSec < 5 ? 'just now' : `${lastUpdatedSec}s ago`}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>
          {allEvents.length} event{allEvents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Combat status indicator */}
      {gameState.inCombat && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          borderRadius: 16,
          background: 'rgba(231,111,81,0.08)',
          border: '1px solid rgba(231,111,81,0.15)',
          marginBottom: 12,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(231,111,81,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Swords size={18} style={{ color: '#e76f51' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e76f51' }}>In Combat</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Active encounter detected</div>
          </div>
          <Zap size={16} style={{ color: '#e76f51', marginLeft: 'auto', filter: 'drop-shadow(0 0 4px rgba(231,111,81,0.4))' }} />
        </div>
      )}

      {/* Character quick stat */}
      {host && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 14,
          background: 'rgba(26,26,38,0.6)',
          border: '1px solid rgba(255,255,255,0.04)',
          marginBottom: 12,
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e8e8ef' }}>
              {safeStr(host.name) || 'Player'}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>
              Lvl {typeof host.level === 'number' ? host.level : '?'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Heart size={12} style={{ color: getHpColor(host.hp, host.maxHp) }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: getHpColor(host.hp, host.maxHp) }}>
              {typeof host.hp === 'number' ? host.hp : '?'}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>/ {typeof host.maxHp === 'number' ? host.maxHp : '?'}</span>
          </div>
        </div>
      )}

      {/* Category filter pills */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 12,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        {(Object.keys(CATEGORY_COLORS) as EventCategory[]).map(cat => {
          const count = categoryCounts[cat];
          if (count === 0) return null;
          return (
            <div
              key={cat}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 8,
                background: `${CATEGORY_COLORS[cat]}10`,
                border: `1px solid ${CATEGORY_COLORS[cat]}20`,
                flexShrink: 0,
              }}
            >
              <span style={{ color: CATEGORY_COLORS[cat], display: 'flex', alignItems: 'center' }}>
                {CATEGORY_ICONS[cat]}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: CATEGORY_COLORS[cat],
                textTransform: 'capitalize' as const,
              }}>
                {cat}
              </span>
              <span style={{
                fontSize: 10,
                color: `${CATEGORY_COLORS[cat]}99`,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Event feed — grouped */}
      <div style={{
        background: 'rgba(26,26,38,0.6)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.04)',
        overflow: 'hidden',
      }}>
        {groups.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.3)',
              margin: '0 0 4px',
            }}>
              No events yet
            </p>
            <p style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.2)',
              margin: 0,
            }}>
              Events will appear as you play
            </p>
          </div>
        ) : (
          <div>
            {groups.map((group, idx) => {
              const isGrouped = group.events.length > 1;
              const expanded = expandedGroups.has(`${group.type}-${idx}`);
              const color = getEventColor(group.type);
              const icon = getEventIcon(group.type);
              const label = getEventLabel(group.type);
              const displayEvents = expanded ? group.events : group.events.slice(0, 3);

              return (
                <div
                  key={`${group.type}-${group.latestTimestamp}-${idx}`}
                  style={{
                    borderBottom: idx < groups.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  }}
                >
                  {/* Group header / single event */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      minHeight: 44,
                      cursor: isGrouped ? 'pointer' : 'default',
                    }}
                    onClick={() => isGrouped && toggleGroup(`${group.type}-${idx}`)}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: `${color}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color,
                    }}>
                      {icon}
                    </div>

                    {/* Label + detail */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#e8e8ef',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {label}
                        {isGrouped && (
                          <span style={{
                            marginLeft: 6,
                            fontSize: 11,
                            color: `${color}99`,
                            fontWeight: 600,
                          }}>
                            x{group.events.length}
                          </span>
                        )}
                      </div>
                      {/* Show latest event detail if present */}
                      {safeStr(group.events[0].detail) && (
                        <div style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.3)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {safeStr(group.events[0].detail)}
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <span style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.25)',
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                    }}>
                      {formatRelative(group.latestTimestamp, now)}
                    </span>

                    {/* Expand chevron for groups */}
                    {isGrouped && (
                      <ChevronDown
                        size={14}
                        style={{
                          color: 'rgba(255,255,255,0.2)',
                          transition: 'transform 0.2s',
                          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>

                  {/* Expanded group items */}
                  {isGrouped && expanded && (
                    <div style={{ paddingLeft: 54, paddingRight: 14, paddingBottom: 8 }}>
                      {displayEvents.map((event, eIdx) => (
                        <div
                          key={`${event.timestamp}-${eIdx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 0',
                            minHeight: 28,
                          }}
                        >
                          <span style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.4)',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {safeStr(event.detail) || getEventLabel(event.type)}
                            {typeof event.amount === 'number' && event.amount != null && (
                              <span style={{ color, marginLeft: 4, fontWeight: 600 }}>
                                {event.amount > 0 ? '+' : ''}{event.amount}
                              </span>
                            )}
                            {safeStr(event.target) && (
                              <span style={{ color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>
                                → {safeStr(event.target)}
                              </span>
                            )}
                            {safeStr(event.entity) && (
                              <span style={{ color: 'rgba(255,255,255,0.25)' }}>
                                {safeStr(event.entity)}
                              </span>
                            )}
                          </span>
                          <span style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.2)',
                            fontVariantNumeric: 'tabular-nums',
                            flexShrink: 0,
                          }}>
                            {formatRelative(event.timestamp, now)}
                          </span>
                        </div>
                      ))}
                      {group.events.length > 3 && !expanded && (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                          +{group.events.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Area context at bottom */}
      {(safeStr(gameState.area) || safeStr(gameState.areaName)) && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          borderRadius: 12,
          background: 'rgba(72,191,227,0.04)',
          border: '1px solid rgba(72,191,227,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <MapPin size={13} style={{ color: '#48bfe3', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            Current area: <strong style={{ color: '#e8e8ef' }}>{safeStr(gameState.areaName) || safeStr(gameState.area)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
