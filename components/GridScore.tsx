import { SCORE_AXES, scoreColor, type GridScore } from "@/lib/gridscore";

/** Radial GridScore gauge with the score, grade, and a trademark label. */
export function GridScoreGauge({ score, grade, size = 132, label = "GridScore" }: { score: number; grade: string; size?: number; label?: string }) {
  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  const color = scoreColor(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#342a20" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline gap-1">
          <span className="tnum text-3xl font-semibold text-ink">{score}</span>
          <span className="text-sm font-semibold" style={{ color }}>
            {grade}
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-[0.18em] text-ink-faint">{label}™</span>
      </div>
    </div>
  );
}

/** The four GridScore axes as labelled bars. */
export function ScoreBreakdown({ gs, compact = false }: { gs: GridScore; compact?: boolean }) {
  return (
    <div className={`flex flex-col ${compact ? "gap-1.5" : "gap-2.5"}`}>
      {SCORE_AXES.map((a) => {
        const v = gs.breakdown[a.key];
        return (
          <div key={a.key}>
            <div className="mb-1 flex items-baseline justify-between text-[11px]">
              <span className="text-ink-muted">{a.label}</span>
              <span className="tnum font-medium text-ink">{v}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full" style={{ width: `${v}%`, background: a.accent }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Small inline GridScore chip for tables and listings. */
export function ScoreChip({ score, grade }: { score: number; grade?: string }) {
  const color = scoreColor(score);
  return (
    <span className="tnum inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-semibold" style={{ color, background: color + "1a" }}>
      {score}
      {grade && <span className="text-[10px] opacity-80">{grade}</span>}
    </span>
  );
}
