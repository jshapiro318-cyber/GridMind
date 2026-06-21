"use client";

import { useRef } from "react";
import { MotionConfig, motion, useScroll, useTransform } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// The signature scroll moment: two cost curves drawn left-to-right as you scroll.
// "Do nothing" runs hot (flame) and compounds; "With GridMind" is cooled and
// climbs gently (mint). The widening gap between them — the savings — fills in.
// Reduced-motion / small screens get the finished chart, statically.
// ─────────────────────────────────────────────────────────────────────────────

const W = 1000;
const H = 440;
const PADX = 56;
const PADT = 40;
const PADB = 52;

// Monthly spend, indexed to 100 at month 0 (illustrative).
const HOT = [100, 109, 119, 129, 141, 153, 167, 181, 197, 215, 234, 254, 277];
const COOL = [100, 86, 75, 73, 75, 78, 81, 84, 87, 90, 94, 98, 102];
const MAXV = 290;

const x = (i: number) => PADX + (i / (HOT.length - 1)) * (W - PADX * 2);
const y = (v: number) => H - PADB - (v / MAXV) * (H - PADB - PADT);
const linePath = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
const areaPath = () =>
  `${COOL.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")} ` +
  `${HOT.map((v, i) => `L${x(HOT.length - 1 - i).toFixed(1)} ${y(HOT[HOT.length - 1 - i]).toFixed(1)}`).join(" ")} Z`;

export function CostCurve() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.4"] });
  const draw = useTransform(scrollYProgress, [0, 0.7], [0, 1]);
  const areaFill = useTransform(scrollYProgress, [0.45, 0.85], [0, 0.12]);
  const labelHot = useTransform(scrollYProgress, [0.3, 0.45], [0, 1]);
  const labelCool = useTransform(scrollYProgress, [0.55, 0.7], [0, 1]);

  const gap = HOT[HOT.length - 1] - COOL[COOL.length - 1]; // ≈ 175 index points

  return (
    <MotionConfig reducedMotion="user">
      <section ref={ref} className="section section-y">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">The math</p>
            <h2 className="display-2 mt-4 text-ink-bright [text-wrap:balance]" data-parallax="-9">
              Every month you wait, the gap <span className="text-brand">widens.</span>
            </h2>
            <p className="lead mt-5 max-w-md text-ink-muted [text-wrap:pretty]">
              Left alone, AI spend climbs with usage <em className="text-ink">and</em> with the premium you pay for
              defaulting to the nearest hyperscaler. GridMind re-routes that same workload to its cheapest viable home —
              so your curve bends the moment you turn it on.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              <Stat value="−27%" label="typical monthly spend" tone="text-leaf" />
              <Stat value="1 click" label="to deploy a re-route" tone="text-ink-bright" />
            </div>
          </div>

          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Projected AI spend over 12 months: doing nothing rises steeply while GridMind keeps it nearly flat, a widening savings gap between them.">
              {/* baseline grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <line key={t} x1={PADX} x2={W - PADX} y1={PADT + t * (H - PADT - PADB)} y2={PADT + t * (H - PADT - PADB)} stroke="#342a20" strokeWidth="1" />
              ))}
              {/* savings gap */}
              <motion.path d={areaPath()} fill="#3fe39a" style={{ opacity: areaFill }} />
              {/* hot curve (do nothing) */}
              <motion.path d={linePath(HOT)} fill="none" stroke="#b0a594" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: draw }} />
              {/* cool curve (with GridMind) */}
              <motion.path d={linePath(COOL)} fill="none" stroke="#3fe39a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: draw }} />
              {/* endpoint dots */}
              <motion.circle cx={x(HOT.length - 1)} cy={y(HOT[HOT.length - 1])} r="5" fill="#b0a594" style={{ opacity: labelHot }} />
              <motion.circle cx={x(COOL.length - 1)} cy={y(COOL[COOL.length - 1])} r="5" fill="#3fe39a" style={{ opacity: labelCool }} />
              {/* labels */}
              <motion.g style={{ opacity: labelHot }}>
                <text x={x(HOT.length - 1) - 8} y={y(HOT[HOT.length - 1]) - 12} textAnchor="end" className="fill-[#b0a594] font-mono text-[15px]">Do nothing</text>
              </motion.g>
              <motion.g style={{ opacity: labelCool }}>
                <text x={x(COOL.length - 1) - 8} y={y(COOL[COOL.length - 1]) + 26} textAnchor="end" className="fill-[#3fe39a] font-mono text-[15px]">With GridMind</text>
              </motion.g>
              {/* axis ticks */}
              <text x={PADX} y={H - 22} className="fill-[#8b8174] font-mono text-[13px]">month 0</text>
              <text x={W - PADX} y={H - 22} textAnchor="end" className="fill-[#8b8174] font-mono text-[13px]">month 12</text>
            </svg>
            <p className="mt-3 text-center font-mono text-[11px] text-ink-faint">Illustrative model · indexed to month 0 · ~{Math.round((gap / HOT[HOT.length - 1]) * 100)}% lower by month 12</p>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div>
      <div className={`tnum text-3xl font-extrabold tracking-[-0.03em] ${tone}`}>{value}</div>
      <div className="mt-1 font-sans text-sm text-ink-muted">{label}</div>
    </div>
  );
}
