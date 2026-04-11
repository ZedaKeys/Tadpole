'use client';

import { APP_NAME } from '@/lib/version';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-lg mx-auto w-full text-center">
      {/* Error icon */}
      <div
        className="mb-6"
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
        }}
      >
        ⚠️
      </div>

      <h1
        className="text-2xl font-bold tracking-tight mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        Something went wrong
      </h1>

      <p
        className="mb-2"
        style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}
      >
        {APP_NAME} encountered an unexpected error.
      </p>

      {error?.message && (
        <p
          className="mb-6"
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            maxWidth: 320,
            wordBreak: 'break-word',
          }}
        >
          {error.message}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="touch-target rounded-xl px-6 py-3 font-semibold"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          Try Again
        </button>

        <a
          href="/"
          className="touch-target rounded-xl px-6 py-3 font-semibold"
          style={{
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            textDecoration: 'none',
            minHeight: 44,
          }}
        >
          Go Home
        </a>
      </div>
    </main>
  );
}
