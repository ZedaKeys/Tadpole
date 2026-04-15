'use client';

import { memo } from 'react';
import {
  Swords, ShieldOff, MapPin, MessageSquare, MessageSquareOff,
  Tent, Skull, Coins, Star, Wind, Eye
} from 'lucide-react';
import type { GameEvent } from '@/types';

function eventIcon(type: string): React.ReactNode {
  const lower = type.toLowerCase();
  if (lower.includes('combat_start')) return <Swords size={13} style={{ color: '#e76f51' }} />;
  if (lower.includes('combat_end')) return <ShieldOff size={13} style={{ color: '#52b788' }} />;
  if (lower.includes('area_changed')) return <MapPin size={13} style={{ color: '#48bfe3' }} />;
  if (lower.includes('dialog_start')) return <MessageSquare size={13} style={{ color: '#c6a255' }} />;
  if (lower.includes('dialog_end')) return <MessageSquareOff size={13} style={{ color: '#6b7280' }} />;
  if (lower.includes('long_rest')) return <Tent size={13} style={{ color: '#52b788' }} />;
  if (lower.includes('short_rest')) return <Tent size={13} style={{ color: '#f4a261' }} />;
  if (lower.includes('character_died') || lower.includes('died')) return <Skull size={13} style={{ color: '#e76f51' }} />;
  if (lower.includes('gold')) return <Coins size={13} style={{ color: '#c6a255' }} />;
  if (lower.includes('level_up') || lower.includes('xp')) return <Star size={13} style={{ color: '#f4a261' }} />;
  if (lower.includes('weather')) return <Wind size={13} style={{ color: '#48bfe3' }} />;
  if (lower.includes('stealth') || lower.includes('sneak')) return <Eye size={13} style={{ color: '#9ca3af' }} />;
  return <Star size={13} style={{ color: '#6b7280' }} />;
}

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

interface SessionTimelineProps {
  events: GameEvent[];
}

export default function SessionTimeline({ events }: SessionTimelineProps) {
  const recent = (events || []).slice(-20).reverse();

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
          marginBottom: 8,
          display: 'block',
        }}
      >
        Session Timeline
      </span>
      <div
        style={{
          borderRadius: 16,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
          maxHeight: 300,
          overflowY: 'auto',
        }}
      >
        {recent.map((ev, i) => {
          const time = new Date(ev.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div
              key={`${ev.timestamp}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <div style={{ flexShrink: 0, display: 'flex' }}>
                {eventIcon(ev.type)}
              </div>
              <span style={{ fontSize: 13, color: '#d1d5db', flex: 1 }}>
                {ev.detail || formatEventType(ev.type)}
              </span>
              <span style={{ fontSize: 10, color: '#6b7280', flexShrink: 0 }}>
                {time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
