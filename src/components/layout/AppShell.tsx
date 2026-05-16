'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import { Header } from './Header';
import { useGameConnection } from '@/hooks/useGameConnection';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  onSearchClick?: () => void;
}

export function AppShell({ title, children, onSearchClick }: AppShellProps) {
  const pathname = usePathname();
  const { isConnected } = useGameConnection();

  const hideNav = pathname === '/' && !isConnected;

  if (title) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <Header title={title} onSearchClick={onSearchClick} />
        <main style={{ flex: 1, maxWidth: 480, margin: '0 auto', width: '100%', padding: '0 20px 100px' }}>
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <main style={{ flex: 1, paddingBottom: hideNav ? 0 : 72 }}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default AppShell;