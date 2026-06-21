/**
 * The GridMind glyph — a routed stack of compute layers. Renders in
 * `currentColor` so the parent controls the tint (brand by default). Decorative,
 * so it is hidden from assistive tech; pair it with a text label or aria-label.
 */
export function BrandMark({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="1.3">
        <path d="M3 7l7-4 7 4-7 4-7-4z" />
        <path d="M3 13l7 4 7-4M3 10l7 4 7-4" opacity="0.5" />
      </g>
    </svg>
  );
}
