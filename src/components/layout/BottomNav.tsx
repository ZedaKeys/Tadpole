'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Activity, Rss, Zap, Settings, Map } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { href: '/', label: 'Live', icon: Activity },
    { href: '/feed', label: 'Feed', icon: Rss },
    { href: '/cheats', label: 'Cheats', icon: Zap },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(5,5,6,0.95)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? '#c6a255' : 'rgba(255,255,255,0.3)',
              transition: 'color 0.15s ease',
              padding: 0,
              height: '100%',
              minHeight: 44,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <tab.icon size={20} strokeWidth={active ? 2.2 : 1.5} />
            <span style={{
              fontSize: 9,
              fontWeight: active ? 600 : 400,
              letterSpacing: 0.3,
              lineHeight: 1,
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
