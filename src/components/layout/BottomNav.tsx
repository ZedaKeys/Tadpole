'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, BookOpen, Users, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavTab {
  href: string;
  label: string;
  icon: LucideIcon;
}

const tabs: NavTab[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/builds', label: 'Builds', icon: Swords },
  { href: '/spells', label: 'Spells', icon: BookOpen },
  { href: '/companions', label: 'Party', icon: Users },
  { href: '/settings', label: 'Settings', icon: Wrench },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="touch-target flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
            style={{
              background: isActive ? 'var(--accent-muted)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              textDecoration: 'none',
            }}
          >
            <tab.icon size={22} />
            <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
