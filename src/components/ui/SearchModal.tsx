'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import type { ScoredResult } from '@/lib/search';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
  onSearch: (query: string) => ScoredResult<Record<string, unknown>>[];
}

export function SearchModal({
  isOpen,
  onClose,
  placeholder = 'Search...',
  onSearch,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const results = query ? onSearch(query) : [];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      {/* Search input bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Search size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="flex-1 bg-transparent outline-none"
          style={{
            color: 'var(--text-primary)',
            fontSize: '1rem',
            border: 'none',
            minHeight: 44,
          }}
        />
        <button
          onClick={onClose}
          className="touch-target flex items-center justify-center rounded-lg"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            minWidth: 44,
            minHeight: 44,
          }}
          aria-label="Close search"
        >
          <X size={22} />
        </button>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {query && results.length === 0 && (
          <p
            className="text-center py-8"
            style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}
          >
            No results found for &quot;{query}&quot;
          </p>
        )}
        {results.map((result, idx) => (
          <div
            key={idx}
            className="rounded-lg px-3 py-3 mb-2"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              {typeof result.item === 'object' && result.item !== null
                ? String((result.item as Record<string, unknown>).name ?? JSON.stringify(result.item))
                : String(result.item)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
