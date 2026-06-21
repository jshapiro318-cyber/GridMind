"use client";

import { useEffect, useRef, useState } from "react";
import { MotionConfig, motion, useScroll, useTransform } from "framer-motion";

type Step = {
  k: string;
  title: string;
  body: string;
  accent: string;
  metric: string;
  metricLabel: string;
};

const STEPS: Step[] = [
  {
    k: "01",
    title: "Connect every provider",
    body: "Link all 8 clouds and GPU fleets in minutes. GridMind ingests spend, utilization, carbon and capacity into one live model — no agents, no rip-and-replace.",
    accent: "#ecb84c",
    metric: "8",
    metricLabel: "providers · 13 regions",
  },
  {
    k: "02",
    title: "Score every placement",
    body: "GridScore™ rates each provider, region and workload from 0–100 across cost, carbon, latency and reliability — so the trade-offs stop being invisible.",
    accent: "#ece4d8",
    metric: "0–100",
    metricLabel: "GridScore per placement",
  },
  {
    k: "03",
    title: "Plan it in one click",
    body: "Approve the recommendation and GridMind produces a step-by-step migration plan for your team to apply in its own console or IaC — modeled at zero performance loss.",
    accent: "#ffd97a",
    metric: "1 click",
    metricLabel: "deploy the optimal mix",
  },
  {
    k: "04",
    title: "Watch the savings land",
    body: "Spend, energy and carbon drop in real time while your GridScore climbs. Forecasts and anomaly alerts keep you ahead of the next budget surprise.",
    accent: "#a8842f",
    metric: "−27%",
    metricLabel: "average spend reduction",
  },
];

function Panel({ s }: { s: Step }) {
  return (
    <div className="relative flex h-full w-full shrink-0 items-center justify-center px-6 lg:w-screen">
      <div className="relative grid w-full max-w-[1100px] grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_minmax(0,420px)]">
        <div>
          <span className="eyebrow" style={{ color: s.accent }}>
            <span className="tnum">{s.k}</span> / 04
          </span>
          <h3 className="display-2 mt-5 text-ink-bright">
            {s.title}
          </h3>
          <p className="mt-5 max-w-lg font-sans text-base leading-relaxed text-ink-muted lg:text-lg">{s.body}</p>
        </div>

        {/* Numeric focal card */}
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-60 blur-3xl"
            style={{ background: `radial-gradient(60% 60% at 50% 30%, ${s.accent}33, transparent 70%)` }}
          />
          <div className="relative overflow-hidden rounded-3xl border border-line-bright/60 bg-bg-card/70 p-8 shadow-e3 backdrop-blur-xl">
            <div className="bg-grid absolute inset-0 opacity-[0.18] [background-size:34px_34px]" aria-hidden />
            <div className="relative">
              <div className="tnum text-[clamp(3rem,7vw,5rem)] font-extrabold leading-none tracking-[-0.04em]" style={{ color: s.accent }}>
                {s.metric}
              </div>
              <div className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-ink-faint">{s.metricLabel}</div>
              <div className="mt-6 h-px w-full bg-gradient-to-r from-line-bright to-transparent" />
              <div className="mt-4 flex items-center gap-2 font-mono text-[11px] text-ink-muted">
                <span className="h-1.5 w-1.5 animate-pulseNode rounded-full" style={{ background: s.accent }} />
                step {s.k} of the GridMind loop
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProcessScroll() {
  const [reduced, setReduced] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Drive the horizontal track. translateX is a % of the track's OWN width
  // (N panels = N*100vw), so travelling (N-1) screens = (N-1)/N of the track.
  const travel = ((STEPS.length - 1) / STEPS.length) * 100;
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${travel}%`]);
  const railWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches || window.innerWidth < 1024);
    apply();
    mq.addEventListener?.("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener?.("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  // Reduced-motion / small-screen fallback: a clean vertical sequence.
  if (reduced) {
    return (
      <section id="how" className="section py-24">
        <Header />
        <div className="mt-12 flex flex-col gap-4">
          {STEPS.map((s) => (
            <div key={s.k} className="rounded-3xl border border-line bg-bg-card p-8">
              <Panel s={s} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      {/* Tall scroll runway; the inner stage is pinned for its duration. */}
      <section id="how" ref={ref} className="relative" style={{ height: `${STEPS.length * 100}vh` }}>
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          <div className="section w-full">
            <Header />
          </div>
          <motion.div style={{ x }} className="mt-10 flex h-[58vh] w-[400vw] will-change-transform">
            {STEPS.map((s) => (
              <Panel key={s.k} s={s} />
            ))}
          </motion.div>
          {/* Progress rail */}
          <div className="section mt-2 w-full">
            <div className="relative h-px w-full overflow-hidden bg-line">
              <motion.div style={{ width: railWidth }} className="h-full bg-gradient-to-r from-brand to-brass" />
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

function Header() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h2 className="display-2 text-ink-bright">How it works.</h2>
      <p className="hidden max-w-xs font-sans text-sm text-ink-muted md:block">
        Connect, score, route, save — the four moves GridMind runs continuously across your whole fleet.
      </p>
    </div>
  );
}
