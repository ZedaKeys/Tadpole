1|'use client';

export const metadata = { title: 'Browse — Tadpole' };

import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import {
  Swords, BookOpen, Users, ScrollText, MapPin,
  Wrench, Heart, Search, Compass, Trophy,
  Package, Gamepad2, Star, Zap
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'Encyclopedia',
    items: [
      { href: '/builds', icon: Swords, label: 'Build Planner', desc: 'Plan & share builds', color: '#f97316' },
      { href: '/spells', icon: Zap, label: 'Spells', desc: '127 spells', color: '#8b5cf6' },
      { href: '/items', icon: Package, label: 'Items', desc: '52 unique items', color: '#22c55e' },
      { href: '/items/equipment', icon: Wrench, label: 'Equipment', desc: 'Per-class gear', color: '#3b82f6' },
      { href: '/companions', icon: Users, label: 'Companions', desc: '8 companions', color: '#ec4899' },
      { href: '/companions/romance', icon: Heart, label: 'Romance', desc: 'Paths & endings', color: '#f43f5e' },
      { href: '/quests', icon: ScrollText, label: 'Quests', desc: '19 walkthroughs', color: '#f59e0b' },
      { href: '/areas', icon: MapPin, label: 'Areas', desc: '40 locations', color: '#10b981' },
      { href: '/lore', icon: BookOpen, label: 'Lore', desc: 'World & gods', color: '#6366f1' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { href: '/games', icon: Gamepad2, label: 'Mini-Games', desc: 'Dice Poker', color: '#f97316' },
      { href: '/tracker', icon: Trophy, label: 'Loot Tracker', desc: 'Session stats', color: '#22c55e' },
      { href: '/tours', icon: Compass, label: 'Tours', desc: 'Guided runs', color: '#06b6d4' },
      { href: '/cheats', icon: Star, label: 'Cheats', desc: 'In-game cmds', color: '#eab308' },
    ],
  },
  {
    title: 'Live Game',
    items: [
      { href: '/live/combat', icon: Swords, label: 'Combat', desc: 'HP & conditions', color: '#e76f51' },
      { href: '/live/approval', icon: Heart, label: 'Approval', desc: 'Real-time', color: '#c6a255' },
      { href: '/map', icon: MapPin, label: 'World Map', desc: 'Area overview', color: '#10b981' },
    ],
  },
];

export default function BrowsePage() {
  return (
    <AppShell title="Browse">
      {/* Search bar */}
      <Link
        href="/search"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 24,
          textDecoration: 'none',
          minHeight: 48,
        }}
      >
        <Search size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Search spells, items, companions...</span>
      </Link>

      {SECTIONS.map((section, si) => (
        <div key={section.title} style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
            marginBottom: 12, paddingLeft: 2,
          }}>
            {section.title}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {section.items.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className="stagger-in"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '14px 6px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  textDecoration: 'none',
                  minHeight: 90,
                  justifyContent: 'center',
                  animationDelay: `${(si * 9 + i) * 0.03}s`,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${item.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e0d8', textAlign: 'center', lineHeight: 1.2 }}>
                  {item.label}
                </span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.2 }}>
                  {item.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </AppShell>
  );
}
