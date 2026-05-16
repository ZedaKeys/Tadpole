'use client';

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color }: BadgeProps) {
  const badgeColor = color ?? 'var(--text-primary)';
  const badgeBackground = color
    ? `color-mix(in srgb, ${badgeColor} 20%, transparent)`
    : 'rgba(255, 255, 255, 0.06)';
  const badgeBorder = color
    ? `color-mix(in srgb, ${badgeColor} 30%, transparent)`
    : 'rgba(255, 255, 255, 0.1)';

  return (
    <span
      className="inline-flex items-center rounded-full whitespace-nowrap"
      style={{
        background: badgeBackground,
        color: badgeColor,
        border: `1px solid ${badgeBorder}`,
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
