'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import { Header } from './Header';
import { useGameConnection } from '@/hooks/useGameConnection';

/**
 * AppShell — wraps page content with navigation.
 *
 * When called with `title` prop (legacy pages): renders Header + content + BottomNav.
 * When called without `title` (from layout.tsx): renders content with BottomNav only,
 * and hides nav on the connection screen.
 */
interface AppShellProps {
  children: ReactNode;
  /** Page title — if provided, renders a Header with this title */
  title?: string;
  /** Optional search callback for Header */
  onSearchClick?: () => void;
}

export function AppShell({ title, children, onSearchClick }: AppShellProps) {
  const pathname = usePathname();
  const { isConnected } = useGameConnection();

  // Hide nav on the connection screen (home page when not connected)
  const hideNav = pathname === '/' && !isConnected;

  // Legacy mode: when title is provided, render the old Header + BottomNav pattern
  // that individual pages used before layout.tsx adopted AppShell.
  if (title) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
      }}>
        <Header title={title} onSearchClick={onSearchClick} />
        <main style={{ flex: 1, padding: '16px 20px 100px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
          {children}
        </main>
        <BottomNav />
      </div>
    );
  }

  // Modern mode: used by layout.tsx — just wraps children with nav space
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <main style={{
        flex: 1,
        paddingBottom: hideNav ? 0 : 72,
      }}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default AppShell;
