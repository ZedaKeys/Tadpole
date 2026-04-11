'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  /** Optional explicit href. If omitted, uses router.back() */
  href?: string;
  /** Label text. Defaults to "Back" */
  label?: string;
}

export function BackButton({ href, label = 'Back' }: BackButtonProps) {
  const router = useRouter();

  const style: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent)',
    fontSize: '0.875rem',
    padding: 0,
    minHeight: 44,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    textDecoration: 'none',
    fontFamily: 'inherit',
  };

  if (href) {
    return (
      <Link href={href} className="touch-target rounded-lg" style={style}>
        <ArrowLeft size={18} />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      onClick={() => router.back()}
      className="touch-target rounded-lg"
      style={style}
    >
      <ArrowLeft size={18} />
      <span>{label}</span>
    </button>
  );
}
