'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="touch-target w-full flex items-center justify-between px-4 py-3"
        style={{
          background: 'transparent',
          border: 'none',
          borderLeft: '3px solid var(--gold)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
        aria-expanded={open}
      >
        <span className="font-semibold text-sm">{title}</span>
        <ChevronDown
          size={18}
          style={{
            color: 'var(--gold-dim)',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          className="px-4 pb-4"
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            borderTop: '1px solid var(--border-strong)',
            background: 'var(--parchment)',
          }}
        >
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
}
