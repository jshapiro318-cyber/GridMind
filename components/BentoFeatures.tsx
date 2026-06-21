"use client";

import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import { SpotlightCard } from "./SpotlightCard";
import { BeamBorder } from "./BeamBorder";
import { TiltCard } from "./TiltCard";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const TILES = [
  {
    k: "AI Routing Center",
    d: "One click turns the recommendation into a step-by-step migration plan you apply in your own console or IaC. Watch your projected GridScore jump.",
    href: "/routing",
    accent: "#ffd97a",
    stat: "modeled −27% · one-click plan",
    span: "md:col-span-2 lg:col-span-2 lg:row-span-2",
    big: true,
  },
  { k: "GridScore™", d: "A 0–100 score for every placement, provider and org — cost, carbon, latency, reliability.", href: "/gridscore", accent: "#b08cff", stat: "67 → 81", span: "md:col-span-2 lg:col-span-2" },
  { k: "Unified Dashboard", d: "Every dollar, model and GPU-hour across all 8 providers, live.", href: "/dashboard", accent: "#ecb84c", span: "lg:col-span-1" },
  { k: "Global Compute Map", d: "Where compute is cheapest, greenest and free — region by region.", href: "/map", accent: "#ff9a5c", span: "lg:col-span-1" },
  { k: "Savings Simulator", d: "Model your optimized spend, energy and carbon before moving a single job.", href: "/simulator", accent: "#3fe39a", span: "md:col-span-2 lg:col-span-2" },
  { k: "Budget Intelligence", d: "Forecast next month, catch anomalies and reclaim idle GPUs automatically.", href: "/budget", accent: "#e8a33c", span: "md:col-span-2 lg:col-span-2" },
];

export function BentoFeatures() {
  return (
    <MotionConfig reducedMotion="user">
      <section id="features" className="mx-auto max-w-[1280px] px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-10 max-w-2xl"
        >
          <h2 className="display-2">
            Five systems.
            <br />
            <span className="text-ink-muted">One intelligence layer.</span>
          </h2>
          <p className="mt-3 font-sans text-ink-muted">Everything you need to see, score, and act on your AI compute — in one place.</p>
        </motion.div>

        <div className="grid auto-rows-[minmax(184px,auto)] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TILES.map((t, i) => {
            const inner = (
              <SpotlightCard className="flex h-full flex-col justify-between p-6" glow={`${t.accent}26`}>
                <div className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-90" style={{ background: t.accent + "26" }} />
                <div className="relative flex items-center justify-between">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.accent }} />
                  {t.stat && <span className="tnum font-mono text-xs" style={{ color: t.accent }}>{t.stat}</span>}
                </div>
                <div className="relative">
                  <h3 className={`font-bold leading-[1.08] tracking-[-0.02em] ${t.big ? "text-[clamp(1.7rem,3vw,2.4rem)]" : "text-xl"}`}>{t.k}</h3>
                  <p className={`mt-2 font-sans leading-relaxed text-ink-muted ${t.big ? "max-w-sm text-sm" : "text-[13px]"}`}>{t.d}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-medium" style={{ color: t.accent }}>
                    Open <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </SpotlightCard>
            );

            return (
              <motion.div
                key={t.k}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: Math.min(i * 0.06, 0.3), ease: EASE }}
                whileHover={{ scale: 1.015 }}
                className={t.span}
              >
                <Link href={t.href} data-cursor="hover" className="block h-full">
                  <TiltCard max={5} className="h-full">
                    {t.big ? (
                      <BeamBorder color={t.accent} duration={8} radius="1.25rem" className="h-full">
                        {inner}
                      </BeamBorder>
                    ) : (
                      <div className="h-full rounded-2xl border border-line bg-bg-card transition-colors duration-300 hover:border-line-bright">{inner}</div>
                    )}
                  </TiltCard>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </MotionConfig>
  );
}
