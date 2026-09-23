export interface StarsProps {
  value: number;
  outOf?: number;
  size?: number;
  className?: string;
  label?: string;
}

// Read-only star rating display (reviews, product cards). Half-stars round
// to the nearest whole star rather than rendering partial glyphs — keeps
// this a simple, dependency-free repeat of a single glyph.
export function Stars({ value, outOf = 5, size = 14, className = '', label }: StarsProps) {
  const filled = Math.round(Math.max(0, Math.min(value, outOf)));
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-accent-2-600 ${className}`}
      style={{ fontSize: size }}
      role="img"
      aria-label={label ?? `${value} out of ${outOf} stars`}
    >
      {Array.from({ length: outOf }, (_, i) => (
        <span key={i} aria-hidden="true" className={i < filled ? '' : 'text-neutral-300'}>
          ★
        </span>
      ))}
    </span>
  );
}
