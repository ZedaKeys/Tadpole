'use client';

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color }: BadgeProps) {
  const badgeColor = color ?? 'var(--text-primary)';

  return (
    <span
      className="inline-flex items-center rounded-full whitespace-nowrap"
      style={{
        background: color ? `${color}20` : 'rgba(255, 255, 255, 0.06)',
        color: badgeColor,
        border: `1px solid ${color ? `${color}30` : 'rgba(255, 255, 255, 0.1)'}`,
        padding: '3px 8px',
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        lineHeight: '1.2',
      }}
    >
      {label}
    </span>
  );
}
