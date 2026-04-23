'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Tadpole] Render error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      padding: '24px',
      textAlign: 'center',
      background: '#0a0a0f',
      color: '#e8e8ef',
    }}>
      <div style={{
        background: 'rgba(198, 162, 85, 0.08)',
        border: '1px solid rgba(198, 162, 85, 0.25)',
        borderRadius: 12,
        padding: '32px 24px',
        maxWidth: 360,
        width: '100%',
      }}>
        <h2 style={{
          fontFamily: "'Cinzel', serif",
          color: '#c6a255',
          marginBottom: 12,
          fontSize: 20,
        }}>
          Something went wrong
        </h2>
        <p style={{
          color: 'rgba(232, 232, 239, 0.7)',
          fontSize: 14,
          marginBottom: 24,
          lineHeight: 1.5,
        }}>
          The companion app encountered an unexpected error. Your game data is safe.
        </p>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
        }}>
          <button
            onClick={reset}
            style={{
              background: 'linear-gradient(135deg, #c6a255, #8b7355)',
              border: 'none',
              borderRadius: 8,
              color: '#0a0a0f',
              fontWeight: 600,
              padding: '12px 24px',
              fontSize: 14,
              cursor: 'pointer',
              minWidth: 160,
              minHeight: 44,
            }}
          >
            Try Again
          </button>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              background: 'transparent',
              border: '1px solid rgba(198, 162, 85, 0.3)',
              borderRadius: 8,
              color: '#c6a255',
              fontWeight: 600,
              padding: '12px 24px',
              fontSize: 14,
              textDecoration: 'none',
              minWidth: 160,
              minHeight: 44,
              lineHeight: '20px',
              textAlign: 'center',
            }}
          >
            Go Home
          </Link>
        </div>
        <p style={{
          color: 'rgba(232, 232, 239, 0.3)',
          fontSize: 11,
          marginTop: 20,
          wordBreak: 'break-word',
          lineHeight: 1.4,
        }}>
          {error?.message || 'Unknown error'}
        </p>
      </div>
    </div>
  );
}
