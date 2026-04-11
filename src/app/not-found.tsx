import Link from 'next/link';
import { APP_NAME } from '@/lib/version';

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-lg mx-auto w-full text-center">
      {/* Decorative brain icon reference */}
      <div
        className="mb-6"
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--accent-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
        }}
      >
        🐸
      </div>

      <h1
        className="text-3xl font-bold tracking-tight mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        Page Not Found
      </h1>

      <p
        className="mb-2"
        style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}
      >
        Even a Nat 20 on Investigation couldn&apos;t find this page.
      </p>

      <p
        className="mb-8"
        style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}
      >
        Perhaps a mischievous tadpole rewrote the illithid script.
        Try returning to the safety of your camp.
      </p>

      <Link
        href="/"
        className="touch-target rounded-xl px-8 py-3 font-semibold"
        style={{
          background: 'var(--accent)',
          color: '#fff',
          textDecoration: 'none',
          minHeight: 44,
        }}
      >
        Return to {APP_NAME}
      </Link>
    </main>
  );
}
