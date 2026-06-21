import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function SectionTitle({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

/**
 * Percentage delta chip. By default green = up. For cost-type metrics where a
 * decrease is good, pass goodWhenDown.
 */
export function Delta({
  value,
  goodWhenDown = false,
  suffix = "vs prev 30d",
}: {
  value: number;
  goodWhenDown?: boolean;
  suffix?: string;
}) {
  const up = value >= 0;
  const good = goodWhenDown ? !up : up;
  const color = good ? "text-leaf" : "text-rose";
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={`tnum font-medium ${color}`}>
        {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
      </span>
      {suffix && <span className="text-ink-faint">{suffix}</span>}
    </span>
  );
}

export function Pill({ children, accent }: { children: ReactNode; accent?: string }) {
  return (
    <span className="pill" style={accent ? { color: accent, borderColor: accent + "44" } : undefined}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, accent = "#ecb84c" }: { value: number; accent?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: accent }} />
    </div>
  );
}
