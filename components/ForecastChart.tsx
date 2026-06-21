"use client";

import { useRef, useState } from "react";
import { usd } from "@/lib/format";

interface P {
  label: string;
  value: number;
  lo: number;
  hi: number;
  forecast: boolean;
}

export function ForecastChart({ points, height = 260 }: { points: P[]; height?: number }) {
  const W = 860;
  const H = 260;
  const padX = 8;
  const padTop = 18;
  const padBot = 26;
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(...points.map((p) => p.hi), 1);
  const n = points.length;
  const step = (W - padX * 2) / Math.max(1, n - 1);
  const x = (i: number) => padX + i * step;
  const y = (v: number) => H - padBot - (v / max) * (H - padTop - padBot);

  const firstFc = points.findIndex((p) => p.forecast);
  const histEnd = firstFc === -1 ? n - 1 : firstFc - 1;

  const histLine = points
    .slice(0, histEnd + 1)
    .map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");
  const histArea = `${histLine} L${x(histEnd)} ${H - padBot} L${x(0)} ${H - padBot} Z`;

  const fcIdx = points.map((_, i) => i).filter((i) => i >= histEnd);
  const fcLine = fcIdx.map((i, j) => `${j ? "L" : "M"}${x(i).toFixed(1)} ${y(points[i].value).toFixed(1)}`).join(" ");
  const bandTop = fcIdx.map((i, j) => `${j ? "L" : "M"}${x(i).toFixed(1)} ${y(points[i].hi).toFixed(1)}`).join(" ");
  const bandBot = [...fcIdx].reverse().map((i) => `L${x(i).toFixed(1)} ${y(points[i].lo).toFixed(1)}`).join(" ");
  const band = `${bandTop} ${bandBot} Z`;

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    setHover(Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1)))));
  };

  const labelIdx = [0, Math.floor(n / 4), histEnd, Math.floor((histEnd + n) / 2), n - 1];

  return (
    <div ref={ref} className="relative w-full" style={{ height }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full" style={{ display: "block" }}>
        <defs>
          <linearGradient id="fc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ecb84c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ecb84c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={padX} x2={W - padX} y1={padTop + t * (H - padTop - padBot)} y2={padTop + t * (H - padTop - padBot)} stroke="#ffffff" strokeOpacity="0.05" />
        ))}
        {/* boundary marker */}
        <line x1={x(histEnd)} x2={x(histEnd)} y1={padTop} y2={H - padBot} stroke="#ff9a5c" strokeOpacity="0.35" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        {/* confidence band */}
        <path d={band} fill="#ff9a5c" fillOpacity="0.1" />
        {/* history */}
        <path d={histArea} fill="url(#fc-grad)" />
        <path d={histLine} fill="none" stroke="#ecb84c" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {/* forecast */}
        <path d={fcLine} fill="none" stroke="#ff9a5c" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={padTop} y2={H - padBot} stroke="#ffffff" strokeOpacity="0.25" vectorEffect="non-scaling-stroke" />
            <circle cx={x(hover)} cy={y(points[hover].value)} r="3.5" fill={points[hover].forecast ? "#ff9a5c" : "#ecb84c"} stroke="#0f0c0a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      <div className="pointer-events-none absolute inset-x-2 bottom-0 flex justify-between text-[10px] text-ink-faint">
        {labelIdx.map((i) => (
          <span key={i}>{points[i]?.label}</span>
        ))}
      </div>
      {/* legend */}
      <div className="pointer-events-none absolute right-2 top-1 flex items-center gap-3 text-[10px] text-ink-faint">
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-3 bg-brand" /> actual
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-3 bg-electric" style={{ borderTop: "1px dashed" }} /> forecast
        </span>
      </div>
      {hover !== null && (
        <div className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-line-bright bg-bg-raised px-2.5 py-1.5 text-xs shadow-card" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <div className="tnum font-semibold text-ink">{usd(points[hover].value, { compact: true })}</div>
          <div className="text-[10px] text-ink-faint">
            {points[hover].label} · {points[hover].forecast ? "forecast" : "actual"}
          </div>
        </div>
      )}
    </div>
  );
}
