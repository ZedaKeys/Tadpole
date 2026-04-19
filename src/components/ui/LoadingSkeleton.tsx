'use client';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'text' | 'list';
}

export function LoadingSkeleton({ count = 3, type = 'card' }: LoadingSkeletonProps) {
  return (
    <div className="w-full">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonShape key={i} type={type} />
      ))}
    </div>
  );
}

function SkeletonShape({ type }: { type: 'card' | 'text' | 'list' }) {
  const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--surface) 25%, var(--surface-hover) 50%, var(--surface) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite',
    borderRadius: 8,
  };

  if (type === 'card') {
    return (
      <div
        className="mb-3"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ ...shimmerStyle, width: '60%', height: 16, marginBottom: 8 }} />
        <div style={{ ...shimmerStyle, width: '90%', height: 12, marginBottom: 4 }} />
        <div style={{ ...shimmerStyle, width: '40%', height: 12 }} />
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div
        className="flex items-center gap-3 mb-3 px-2 py-3"
        style={{
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ ...shimmerStyle, width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
        <div className="flex-1">
          <div style={{ ...shimmerStyle, width: '50%', height: 14, marginBottom: 6 }} />
          <div style={{ ...shimmerStyle, width: '80%', height: 10 }} />
        </div>
      </div>
    );
  }

  // text
  return (
    <div className="mb-4">
      <div style={{ ...shimmerStyle, width: '100%', height: 14, marginBottom: 6 }} />
      <div style={{ ...shimmerStyle, width: '75%', height: 14, marginBottom: 6 }} />
      <div style={{ ...shimmerStyle, width: '50%', height: 14 }} />
    </div>
  );
}
