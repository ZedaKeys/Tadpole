'use client';

import { Search, Settings } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  onSearchClick?: () => void;
}

export function Header({ title, onSearchClick }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 glass-panel"
      style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Title — Cinzel serif, clean gold */}
        <h1
          className="font-heading text-lg truncate"
          style={{
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--gold)',
          }}
        >
          {title}
        </h1>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="touch-target flex items-center justify-center rounded-lg"
              style={{
                minWidth: 44,
                minHeight: 44,
                background: 'transparent',
                border: 'none',
                color: 'var(--gold-dim)',
                transition: 'color 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
              aria-label="Search"
            >
              <Search size={20} strokeWidth={1.8} />
            </button>
          )}

          <Link
            href="/settings"
            className="touch-target flex items-center justify-center rounded-lg"
            style={{
              minWidth: 44,
              minHeight: 44,
              background: 'transparent',
              border: 'none',
              color: 'var(--gold-dim)',
              transition: 'color 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
            aria-label="Settings"
          >
            <Settings size={20} strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </header>
  );
}
