'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

interface CardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
}

export function Card({ title, description, icon, onClick, href }: CardProps) {
  const content = (
    <>
      {icon && (
        <div className="flex-shrink-0 mb-2" style={{ color: 'var(--accent)' }}>
          {icon}
        </div>
      )}
      <h3
        className="font-semibold text-sm leading-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-xs mt-1 leading-snug"
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </p>
      )}
    </>
  );

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 16,
    minHeight: 44,
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    textDecoration: 'none',
  };

  if (href) {
    return (
      <Link href={href} style={baseStyle} className="touch-target">
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{ ...baseStyle, textAlign: 'left', border: '1px solid var(--border)' }}
      className="touch-target w-full"
    >
      {content}
    </button>
  );
}
