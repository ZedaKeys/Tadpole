'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="w-full">
      {(label || total > 0) && (
        <div
          className="flex justify-between items-center mb-1.5"
          style={{ fontSize: '0.8rem' }}
        >
          {label && (
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          )}
          <span
            className="font-mono-num"
            style={{ color: 'var(--text-secondary)' }}
          >
            {current}/{total}
          </span>
        </div>
      )}

      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height: 8,
          background: 'var(--surface-active)',
        }}
      >
        <div
          className="rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'var(--accent)',
          }}
        />
      </div>

      <div className="text-right mt-1">
        <span
          className="font-mono-num"
          style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
}
