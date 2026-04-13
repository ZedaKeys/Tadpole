'use client';

import type { ReactNode } from 'react';
import { Header } from './Header';
import BottomNav from './BottomNav';

interface AppShellProps {
  title: string;
  children: ReactNode;
  onSearchClick?: () => void;
}

export function AppShell({ title, children, onSearchClick }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header title={title} onSearchClick={onSearchClick} />
      <main
        className="flex-1 px-5 py-4 max-w-lg mx-auto w-full"
        style={{ paddingBottom: 100 }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
