'use client';

import Link from 'next/link';

export default function NotFound() {
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
        background: 'rgba(26, 24, 48, 0.8)',
        border: '1px solid rgba(198, 162, 85, 0.2)',
        borderRadius: 12,
        padding: '40px 24px',
        maxWidth: 360,
        width: '100%',
      }}>
        <div style={{
          fontSize: 64,
          marginBottom: 8,
          opacity: 0.6,
        }}>
          404
        </div>
        <h1 style={{
          fontFamily: "'Cinzel', serif",
          color: '#c6a255',
          marginBottom: 12,
          fontSize: 20,
        }}>
          Lost in the Underdark
        </h1>
        <p style={{
          color: 'rgba(232, 232, 239, 0.6)',
          fontSize: 14,
          marginBottom: 28,
          lineHeight: 1.5,
        }}>
          You&apos;ve wandered into uncharted tunnels. Even Darkvision cannot reveal a page here. Best return to camp before the mind flayers find you.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #c6a255, #8b7355)',
            borderRadius: 8,
            color: '#0a0a0f',
            fontWeight: 600,
            padding: '12px 24px',
            fontSize: 14,
            textDecoration: 'none',
            minWidth: 160,
            minHeight: 44,
            lineHeight: '20px',
          }}
        >
          Return to Camp
        </Link>
      </div>
    </div>
  );
}
