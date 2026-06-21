"use client";

import { useRef, useState } from "react";
import { compact, usd } from "@/lib/format";

type Unit = "usd" | "num" | "pct" | "kg";
function fmt(v: number, unit: Unit): string {
  switch (unit) {
    case "usd":
      return usd(v, { compact: true });
    case "pct":
      return `${v.toFixed(1)}%`;
    case "kg":
      return v >= 1000 ? `${(v / 1000).toFixed(1)} t` : `${Math.round(v)} kg`;
    default:
      return compact(v);
  }
}

// ── Sparkline ────────────────────────────────────────────────────────────────
export function Sparkline({ values, color = "#ecb84c", w = 120, h = 34 }: { values: number[]; color?: string; w?: number; h?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - 2 - ((v - min) / span) * (h - 4)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const id = `sp-${color.replace("#", "")}-${values.length}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Area chart with hover ────────────────────────────────────────────────────
export function AreaChart({
  data,
  color = "#ecb84c",
  height = 240,
  unit = "num",
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  unit?: Unit;
}) {
  const W = 820;
  const H = 240;
  const padX = 8;
  const padTop = 16;
  const padBot = 26;
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const step = (W - padX * 2) / Math.max(1, n - 1);
  const x = (i: number) => padX + i * step;
  const y = (v: number) => H - padBot - (v / max) * (H - padTop - padBot);

  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1)} ${H - padBot} L${x(0)} ${H - padBot} Z`;

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    setHover(Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1)))));
  };

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const labelIdx = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1];

  return (
    <div ref={ref} className="relative w-full" style={{ height }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full" style={{ display: "block" }}>
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <line key={t} x1={padX} x2={W - padX} y1={padTop + t * (H - padTop - padBot)} y2={padTop + t * (H - padTop - padBot)} stroke="#ffffff" strokeOpacity="0.05" />
        ))}
        <path d={area} fill="url(#area-grad)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={padTop} y2={H - padBot} stroke={color} strokeOpacity="0.4" vectorEffect="non-scaling-stroke" />
            <circle cx={x(hover)} cy={y(data[hover].value)} r="3.5" fill={color} stroke="#0f0c0a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      {/* x labels */}
      <div className="pointer-events-none absolute inset-x-2 bottom-0 flex justify-between text-[10px] text-ink-faint">
        {labelIdx.map((i) => (
          <span key={i}>{data[i] ? data[i].label : ""}</span>
        ))}
      </div>
      {/* tooltip */}
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-line-bright bg-bg-raised px-2.5 py-1.5 text-xs shadow-card"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <div className="tnum font-semibold text-ink">{fmt(data[hover].value, unit)}</div>
          <div className="text-[10px] text-ink-faint">{data[hover].label}</div>
        </div>
      )}
    </div>
  );
}

// ── Horizontal bar list ──────────────────────────────────────────────────────
export function BarList({
  items,
  unit = "usd",
}: {
  items: { id: string; label: string; value: number; accent?: string; meta?: string }[];
  unit?: Unit;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((it) => (
        <div key={it.id} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 truncate text-ink">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: it.accent ?? "#ecb84c" }} />
              <span className="truncate">{it.label}</span>
              {it.meta && <span className="hidden truncate text-[10px] text-ink-faint sm:inline">{it.meta}</span>}
            </span>
            <span className="tnum shrink-0 font-medium text-ink-muted">{fmt(it.value, unit)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/60">
            <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${(it.value / max) * 100}%`, background: it.accent ?? "#ecb84c" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Donut ────────────────────────────────────────────────────────────────────
export function Donut({
  segments,
  centerLabel,
  centerValue,
  size = 150,
}: {
  segments: { id: string; label: string; value: number; accent: string }[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}) {
  const r = size / 2 - 11;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#342a20" strokeWidth="14" />
        {segments.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.id}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.accent}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerValue && <span className="tnum text-lg font-semibold text-ink">{centerValue}</span>}
        {centerLabel && <span className="text-[10px] uppercase tracking-wider text-ink-faint">{centerLabel}</span>}
      </div>
    </div>
  );
}

// ── Radial gauge (utilization) ───────────────────────────────────────────────
export function Ring({ value, label, color = "#ecb84c", size = 132 }: { value: number; label?: string; color?: string; size?: number }) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#342a20" strokeWidth="10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${pct * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-2xl font-semibold text-ink">{Math.round(pct * 100)}%</span>
        {label && <span className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</span>}
      </div>
    </div>
  );
}
