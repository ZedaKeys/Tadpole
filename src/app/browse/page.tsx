'use client';

import Link from 'next/link';
import {
  Swords, BookOpen, Users, ScrollText, MapPin,
  Wrench, Heart, Search, Compass, Trophy,
  Package, Gamepad2, Zap, Star,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';

const SECTIONS = [
  {
    title: 'Encyclopedia',
    items: [
      { href: '/builds',             icon: Swords,     label: 'Builds',     desc: 'Plan builds',      color: '#5B8AFF' },
      { href: '/spells',             icon: Zap,        label: 'Spells',     desc: 'All spells',       color: '#A855F7' },
      { href: '/items',              icon: Package,    label: 'Items',      desc: 'Browse items',    color: '#22C55E' },
      { href: '/items/equipment',    icon: Wrench,     label: 'Equipment',  desc: 'By class',        color: '#3B82F6' },
      { href: '/companions',         icon: Users,      label: 'Companions', desc: '8 companions',    color: '#EC4899' },
      { href: '/companions/romance', icon: Heart,      label: 'Romance',    desc: 'Paths & endings', color: '#F43F5E' },
      { href: '/quests',             icon: ScrollText, label: 'Quests',     desc: 'Walkthroughs',    color: '#F59E0B' },
      { href: '/areas',              icon: MapPin,     label: 'Areas',      desc: 'Locations',       color: '#10B981' },
      { href: '/lore',               icon: BookOpen,   label: 'Lore',       desc: 'World & gods',    color: '#6366F1' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { href: '/games',   icon: Gamepad2, label: 'Mini-Games', desc: 'Dice & trivia', color: '#F97316' },
      { href: '/tracker', icon: Trophy,   label: 'Loot Tracker',desc: 'Session stats', color: '#22C55E' },
      { href: '/tours',   icon: Compass, label: 'Tours',       desc: 'Guided runs',   color: '#06B6D4' },
      { href: '/cheats',  icon: Star,     label: 'Cheats',      desc: 'In-game cmds', color: '#EAB308' },
    ],
  },
  {
    title: 'Live Game',
    items: [
      { href: '/live/combat',   icon: Swords, label: 'Combat',   desc: 'HP & conditions', color: '#F87171' },
      { href: '/live/approval',icon: Heart,  label: 'Approval',  desc: 'Real-time',        color: '#5B8AFF' },
      { href: '/map',          icon: MapPin, label: 'World Map',desc: 'Area overview',   color: '#10B981' },
    ],
  },
];

export default function BrowsePage() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 100px' }}>
      {/* Search */}
      <Link href="/search" className="browse-search-bar" aria-label="Search">
        <Search size={17} strokeWidth={1.8} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="browse-search-label">Search terminal</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-2)', marginTop: 1 }}>Spells, items, companions...</div>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'monospace' }}>⌘K</span>
      </Link>

      {SECTIONS.map((section) => (
        <section key={section.title} className="browse-section">
          <h2 className="browse-section-title">{section.title}</h2>
          <div className="browse-grid">
            {section.items.map(({ href, icon: Icon, label, desc, color }) => (
              <Link
                key={href}
                href={href}
                className="browse-card"
                aria-label={label}
              >
                <div
                  className="browse-card-icon"
                  style={{ color, borderColor: `${color}40` }}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <span className="browse-card-label">{label}</span>
                <span className="browse-card-desc">{desc}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}