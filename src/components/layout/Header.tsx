'use client';

import { Search, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  onSearchClick?: () => void;
}

export function Header({ title, onSearchClick }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 py-3 sticky top-0 z-30"
      style={{
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <h1
        className="text-lg font-bold tracking-tight truncate"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-1">
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="touch-target flex items-center justify-center rounded-lg transition-colors"
            style={{
              minWidth: 44,
              minHeight: 44,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
            }}
            aria-label="Search"
          >
            <Search size={22} />
          </button>
        )}

        <a
          href="/settings"
          className="touch-target flex items-center justify-center rounded-lg transition-colors"
          style={{
            minWidth: 44,
            minHeight: 44,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
          }}
          aria-label="Settings"
        >
          <Settings size={22} />
        </a>
      </div>
    </header>
  );
}
