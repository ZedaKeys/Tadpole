'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

interface CardProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  accentColor?: string;
  /** Optional stagger delay for stagger-in animation */
  delay?: number;
}

export function Card({ title, description, icon, onClick, href, accentColor, delay }: CardProps) {
  const content = (
    <div
      className="card-inner"
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: accentColor
          ? `linear-gradient(160deg, ${accentColor}0C, rgba(255,255,255,0.02))`
          : undefined,
      }}
    >
      {/* Optional bottom accent line */}
      {accentColor && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 0,
            height: 2,
            borderRadius: 1,
            background: `linear-gradient(90deg, ${accentColor}40, transparent)`,
          }}
        />
      )}

      {icon && (
        <div
          className="flex-shrink-0 flex items-center justify-center mb-2"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: accentColor ? `${accentColor}18` : 'rgba(255, 255, 255, 0.04)',
            color: accentColor ?? 'var(--gold)',
          }}
        >
          {icon}
        </div>
      )}
      <h3
        className="font-heading text-sm leading-tight truncate"
        style={{
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </h3>
      {description && (
        <div
          className="text-xs mt-1 leading-snug truncate-2"
          style={{
            color: 'var(--text-secondary)',
          }}
        >
          {description}
        </div>
      )}
    </div>
  );

  const staggerStyle = delay !== undefined
    ? { textDecoration: 'none' as const, animationDelay: `${delay}s` }
    : { textDecoration: 'none' as const };

  if (href) {
    return (
      <Link
        href={href}
        className="bg3-card-premium touch-target stagger-in"
        style={staggerStyle}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="bg3-card-premium touch-target w-full text-left stagger-in"
      style={{ border: 'none', cursor: 'pointer', ...staggerStyle }}
    >
      {content}
    </button>
  );
}
