'use client';

import { useState } from 'react';

interface SpoilerTextProps {
  text: string;
  spoilerLevel: number;
  className?: string;
}

export function SpoilerText({ text, spoilerLevel, className }: SpoilerTextProps) {
  const [revealed, setRevealed] = useState(false);

  // spoilerLevel 0 is always visible
  if (spoilerLevel === 0) {
    return (
      <span className={className} style={{ color: 'var(--text-primary)' }}>
        {text}
      </span>
    );
  }

  if (revealed) {
    return (
      <span
        className={`${className ?? ''} spoiler-revealed`}
        style={{ color: 'var(--text-primary)', cursor: 'pointer' }}
        onClick={() => setRevealed(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setRevealed(false);
        }}
      >
        {text}
      </span>
    );
  }

  return (
    <span
      className={`${className ?? ''} spoiler-blur`}
      style={{ color: 'var(--text-primary)' }}
      onClick={() => setRevealed(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setRevealed(true);
      }}
      aria-label="Click to reveal spoiler"
    >
      {text}
    </span>
  );
}
