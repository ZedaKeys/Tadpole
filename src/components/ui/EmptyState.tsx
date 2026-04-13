'use client';

import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      {icon && (
        <div className="mb-4" style={{ color: 'var(--gold-dim)' }}>
          {icon}
        </div>
      )}
      <h3
        className="font-semibold text-base mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            maxWidth: 280,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
