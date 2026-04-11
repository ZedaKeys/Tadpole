'use client';

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{
        background: color ? `${color}22` : 'var(--accent-muted)',
        color: color ?? 'var(--accent)',
      }}
    >
      {label}
    </span>
  );
}
