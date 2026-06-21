"use client";

import { useEffect, useRef, useState } from "react";
import { gradeOf, scoreColor } from "@/lib/gridscore";

const TARGET = 81;
const SAVINGS = 144133;

/**
 * The hero's live product moment: a GridScore gauge that climbs to its optimized
 * value while the savings counts up. Custom data-viz, not decoration — it shows
 * exactly what GridMind does.
 */
export function HeroPanel() {
  const [score, setScore] = useState(0);
  const [save, setSave] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setScore(TARGET);
      setSave(SAVINGS);
      return;
    }
    const start = performance.now();
    const dur = 1700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setScore(Math.round(e * TARGET));
      setSave(Math.round(e * SAVINGS));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const r = 56;
  const c = 2 * Math.PI * r;
  const color = scoreColor(score);

  return (
    <div className="hero-fade relative w-full max-w-[400px] rounded-2xl border border-line-bright/70 bg-bg-card/80 p-6 shadow-card backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-brand/15 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          <span className="h-1.5 w-1.5 animate-pulseNode rounded-full bg-brand" /> Live optimization
        </span>
        <span className="font-mono text-[11px] text-ink-faint">us-east-1 → eu-north-1</span>
      </div>

      <div className="relative mt-5 flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
          <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#342a20" strokeWidth="9" />
            <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} style={{ transition: "stroke 0.3s" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-baseline gap-1">
              <span className="tnum text-4xl font-semibold text-ink">{score}</span>
              <span className="text-base font-semibold" style={{ color }}>{gradeOf(score)}</span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">GridScore™</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="text-xs text-ink-faint">Monthly savings</div>
          <div className="tnum text-2xl font-semibold tracking-tight text-leaf">${save.toLocaleString("en-US")}</div>
          <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
            <div>
              <div className="tnum font-medium text-leaf">−27%</div>
              <div className="text-ink-faint">spend</div>
            </div>
            <div>
              <div className="tnum font-medium text-leaf">−93%</div>
              <div className="text-ink-faint">carbon</div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-5 border-t border-line pt-3 font-mono text-[11px] text-ink-muted">
        <span className="text-leaf">✓</span> Routing 240,946 GPU-hrs across 8 providers
      </div>
    </div>
  );
}
