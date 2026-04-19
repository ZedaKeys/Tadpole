import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function Loading() {
  return (
    <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full" style={{ paddingBottom: 100 }}>
      {/* Header skeleton */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 mb-4"
        style={{
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          margin: '0 -16px',
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            width: 120,
            height: 20,
            background: 'var(--surface)',
            borderRadius: 6,
          }}
        />
        <div
          style={{
            width: 44,
            height: 44,
            background: 'var(--surface)',
            borderRadius: 8,
          }}
        />
      </div>

      <LoadingSkeleton count={4} type="card" />
    </main>
  );
}
