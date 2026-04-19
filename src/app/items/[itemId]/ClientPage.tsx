'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, BookOpen, Shield, Sparkles } from 'lucide-react';
import { items } from '@/data/items';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Accordion';
import { AppShell } from '@/components/layout/AppShell';
import type { ItemRarity } from '@/types';

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'var(--rarity-common)',
  uncommon: 'var(--rarity-uncommon)',
  rare: 'var(--rarity-rare)',
  'very rare': 'var(--rarity-very-rare)',
  legendary: 'var(--rarity-legendary)',
};

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <Icon size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1">
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div className="break-words" style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
          {value}
        </div>
      </div>
    </div>
  );
}
export default function ItemDetailClientPage({ params }: { params: { itemId: string } }) {
  const router = useRouter();
  const item = items.find((i) => i.id === params.itemId);

  if (!item) {
    return (
      <AppShell title="Item Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Item not found.
          </p>
          <button
            onClick={() => router.push('/items')}
            className="touch-target mt-4 rounded-lg px-6 py-3 font-medium"
            style={{
              background: 'var(--gold)',
              color: '#fff',
              border: 'none',
            }}
          >
            Back to Items
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={item.name}>
      {/* Back button */}
      <button
        onClick={() => router.push('/items')}
        className="stagger-in touch-target flex items-center gap-1 mb-4 rounded-lg"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--gold)',
          fontSize: '0.875rem',
          padding: 0,
          minHeight: 44,
          animationDelay: '0s',
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Items</span>
      </button>

      {/* Header */}
      <div className="stagger-in mb-5" style={{ animationDelay: '0.05s' }}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge
            label={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            color="var(--gold)"
          />
          <Badge
            label={item.rarity}
            color={RARITY_COLORS[item.rarity]}
          />
          <Badge
            label={`Act ${item.act}`}
            color="var(--info)"
          />
        </div>
        <h2
          className="text-2xl font-bold font-heading"
          style={{ color: 'var(--text-primary)' }}
        >
          {item.name}
        </h2>
      </div>

      {/* Detail rows */}
      <div className="stagger-in mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '12px 16px', animationDelay: '0.1s' }}>
        <DetailRow icon={Sparkles} label="Rarity" value={item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} />
        <DetailRow icon={Shield} label="Type" value={item.type.charAt(0).toUpperCase() + item.type.slice(1)} />
        <DetailRow icon={MapPin} label="Location" value={item.location} />
        <DetailRow icon={BookOpen} label="Act" value={`Act ${item.act}`} />
        {item.requirements && (
          <DetailRow icon={Shield} label="Requirements" value={item.requirements} />
        )}
      </div>

      {/* Description */}
      <div className="stagger-in mb-5" style={{ animationDelay: '0.15s' }}>
        <h3
          className="font-semibold text-sm mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <BookOpen size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Description
        </h3>
        <p
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            lineHeight: 1.7,
          }}
        >
          {item.description}
        </p>
      </div>

      {/* Effects accordion */}
      {item.effects && item.effects.length > 0 && (
        <div className="stagger-in mb-3" style={{ animationDelay: '0.2s' }}>
          <Accordion title={`Effects (${item.effects.length})`}>
            <ul className="space-y-2">
              {item.effects.map((effect, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2"
                  style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}
                >
                  <span
                    style={{
                      color: 'var(--gold)',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    •
                  </span>
                  <span>{effect}</span>
                </li>
              ))}
            </ul>
          </Accordion>
        </div>
      )}
    </AppShell>
  );
}
