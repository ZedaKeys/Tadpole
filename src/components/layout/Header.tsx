'use client';

import { Search, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  onSearchClick?: () => void;
  showBack?: boolean;
}

export function Header({ title, onSearchClick, showBack }: HeaderProps) {
  const router = useRouter();

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 56,
        maxWidth: 480,
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {showBack && (
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                background: 'none',
                border: 'none',
                color: 'var(--text-2)',
                cursor: 'pointer',
                marginLeft: -10,
                flexShrink: 0,
              }}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--text)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {title}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                background: 'none',
                border: 'none',
                color: 'var(--text-2)',
                cursor: 'pointer',
              }}
              aria-label="Search"
            >
              <Search size={20} strokeWidth={1.8} />
            </button>
          )}
          <Link
            href="/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              color: 'var(--text-2)',
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