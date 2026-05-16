'use client';

import type { GameState } from '@/types';
import { safeStr, safeNum } from '@/lib/safe-cast';

interface WidgetProps { gameState: GameState; }

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function SessionTimelineWidget({ gameState }: WidgetProps) {
  const events = gameState.events || [];
  const recentEvents = events.slice(-8).reverse();

  return (
    <div className="widget-card">
      <h3 className="widget-title">Session Timeline</h3>
      {recentEvents.length === 0
        ? <p className="widget-note">No events yet</p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentEvents.map((event, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 999, flexShrink: 0,
                  marginTop: 4, background: 'var(--text-3)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {safeStr(event.detail || event.type || '')}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', margin: '2px 0 0' }}>
                    {timeAgo(safeNum(event.timestamp))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}