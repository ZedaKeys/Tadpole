'use client';

import { memo } from 'react';
import {
  Swords, ShieldOff, MapPin, MessageSquare, MessageSquareOff,
  Tent, Skull, Coins, Star, Wind, Eye, HeartPlus, Sparkles
} from 'lucide-react';
import type { GameEvent } from '@/types';

function eventStyle(type: string): { icon: React.ReactNode; color: string; bg: string } {
  const lower = type.toLowerCase();
  if (lower.includes('combat_start')) return { icon: <Swords size={13} />, color: '#e76f51', bg: 'rgba(231,111,81,0.12)' };
  if (lower.includes('combat_end')) return { icon: <ShieldOff size={13} />, color: '#52b788', bg: 'rgba(82,183,136,0.12)' };
  if (lower.includes('area_changed')) return { icon: <MapPin size={13} />, color: '#48bfe3', bg: 'rgba(72,191,227,0.12)' };
  if (lower.includes('dialog_start')) return { icon: <MessageSquare size={13} />, color: '#c6a255', bg: 'rgba(198,162,85,0.12)' };
  if (lower.includes('dialog_end')) return { icon: <MessageSquareOff size={13} />, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };
  if (lower.includes('long_rest')) return { icon: <Sparkles size={13} />, color: '#52b788', bg: 'rgba(82,183,136,0.12)' };
  if (lower.includes('short_rest')) return { icon: <Tent size={13} />, color: '#f4a261', bg: 'rgba(244,162,97,0.12)' };
  if (lower.includes('died') || lower.includes('dead')) return { icon: <Skull size={13} />, color: '#e76f51', bg: 'rgba(231,111,81,0.12)' };
  if (lower.includes('gold')) return { icon: <Coins size={13} />, color: '#c6a255', bg: 'rgba(198,162,85,0.12)' };
  if (lower.includes('level_up') || lower.includes('xp')) return { icon: <Star size={13} />, color: '#f4a261', bg: 'rgba(244,162,97,0.12)' };
  if (lower.includes('weather')) return { icon: <Wind size={13} />, color: '#48bfe3', bg: 'rgba(72,191,227,0.12)' };
  if (lower.includes('stealth') || lower.includes('sneak')) return { icon: <Eye size={13} />, color: '#9ca3af', bg: 'rgba(107,114,128,0.12)' };
  if (lower.includes('heal')) return { icon: <HeartPlus size={13} />, color: '#52b788', bg: 'rgba(82,183,136,0.12)' };
  return { icon: <Star size={13} />, color: '#6b7280', bg: 'rgba(107,114,128,0.08)' };
}

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatTime(timestamp: number | string): string {
  try {
    return new Date(typeof timestamp === 'number' ? timestamp : timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
}

interface SessionTimelineProps {
  events: GameEvent[];
}

export default function SessionTimeline({ events }: SessionTimelineProps) {
  const recent = (events || []).slice(-15).reverse();

  if (recent.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#6b7280',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 10,
          display: 'block',
        }}
      >
        Session Timeline
      </span>

      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {/* Vertical timeline line */}
        <div style={{
          position: 'absolute',
          left: 10,
          top: 8,
          bottom: 8,
          width: 2,
          background: 'linear-gradient(180deg, rgba(198,162,85,0.3), rgba(198,162,85,0.05))',
          borderRadius: 1,
        }} />

        {recent.map((ev, i) => {
          const style = eventStyle(ev.type);
          const isLast = i === recent.length - 1;
          const time = formatTime(ev.timestamp);

          return (
            <div
              key={`${ev.timestamp}-${i}`}
              className={`animate-fade-up ${i < 6 ? `stagger-${i + 1}` : ''}`}
              style={{
                position: 'relative',
                paddingBottom: isLast ? 0 : 16,
              }}
            >
              {/* Timeline dot */}
              <div style={{
                position: 'absolute',
                left: -28 + 5, // align with line (10px) - half dot width
                top: 6,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: style.bg,
                border: `2px solid ${style.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }} />

              {/* Event card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 10,
                background: style.bg,
                border: `1px solid ${style.color}15`,
                transition: 'background 0.2s',
              }}>
                <div style={{
                  flexShrink: 0,
                  display: 'flex',
                  color: style.color,
                }}>
                  {style.icon}
                </div>
                <span style={{ fontSize: 13, color: '#d1d5db', flex: 1, fontWeight: 500 }}>
                  {ev.detail || formatEventType(ev.type)}
                </span>
                {time && (
                  <span style={{
                    fontSize: 10, color: '#6b7280', flexShrink: 0,
                    fontFeatureSettings: '"tnum"',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {time}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
