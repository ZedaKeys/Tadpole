'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Activity, Rss, Zap, Settings, Compass } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { href: '/',        label: 'Live',    icon: Activity },
    { href: '/feed',     label: 'Feed',    icon: Rss },
    { href: '/browse',  label: 'Browse',  icon: Compass },
    { href: '/cheats',  label: 'Cheats',  icon: Zap },
    { href: '/settings',label: 'Settings',icon: Settings },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            className={`nav-btn${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <tab.icon size={20} strokeWidth={active ? 2 : 1.5} />
            <span className="nav-btn-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}