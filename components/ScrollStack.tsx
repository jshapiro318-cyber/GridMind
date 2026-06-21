"use client";

import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";

// Sticky-stacking cards: each panel pins a little lower than the last, so they
// fan into a deck as you scroll. Pure CSS `position: sticky` does the stacking
// (works under reduced motion and with JS off); Framer only adds the entrance.

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Card = { k: string; tag: string; title: string; body: string; accent: string; href: string };
const CARDS: Card[] = [
  { k: "score", tag: "Measure", title: "Score every placement", accent: "#ecb84c", href: "/gridscore",
    body: "GridScore™ rates each provider, region and workload 0–100 on cost, carbon, latency and reliability — the trade-offs stop being invisible." },
  { k: "route", tag: "Decide", title: "Route by what you care about", accent: "#ffd97a", href: "/routing",
    body: "Optimize for lowest cost, fastest speed, greenest grid, or a balance. The engine ranks every viable home for the job and picks the winner." },
  { k: "deploy", tag: "Plan", title: "Plan the cutover, downtime-free", accent: "#ece4d8", href: "/routing",
    body: "Approve once and GridMind generates a step-by-step migration plan — yours to apply in your own console or IaC, sequenced for zero downtime." },
  { k: "guard", tag: "Protect", title: "Guard the budget, automatically", accent: "#a8842f", href: "/budget",
    body: "Forecast next month, catch anomalies the day they spike, and reclaim idle GPUs before they show up on the invoice." },
];

export function ScrollStack() {
  return (
    <MotionConfig reducedMotion="user">
      <section id="engine" className="section section-y">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Inside the engine</p>
          <h2 className="display-2 mt-4 text-ink-bright [text-wrap:balance]" data-parallax="-8">
            Four moves, run continuously across your whole fleet.
          </h2>
        </div>

        <div className="relative">
          {CARDS.map((c, i) => (
            <div key={c.k} className="sticky" style={{ top: `calc(6rem + ${i * 1.6}rem)` }}>
              <motion.article
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.6, ease: EASE }}
                className="mb-6 grid min-h-[clamp(20rem,52vh,30rem)] grid-cols-1 gap-8 overflow-hidden rounded-[1.75rem] border border-line bg-bg-card p-8 shadow-e3 sm:p-12 lg:grid-cols-[1fr_minmax(0,40%)] lg:items-center"
                style={{ boxShadow: `0 -1px 0 0 ${c.accent}22 inset, 0 40px 90px -40px rgba(0,0,0,0.85)` }}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="tnum font-mono text-sm" style={{ color: c.accent }}>0{i + 1}</span>
                    <span className="h-px w-8" style={{ background: c.accent }} />
                    <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-faint">{c.tag}</span>
                  </div>
                  <h3 className="mt-5 max-w-md text-[clamp(1.8rem,3.4vw,2.7rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-ink-bright [text-wrap:balance]">
                    {c.title}
                  </h3>
                  <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-ink-muted [text-wrap:pretty]">{c.body}</p>
                  <Link href={c.href} className="mt-6 inline-flex items-center gap-1.5 font-sans text-sm font-semibold" style={{ color: c.accent }}>
                    See it live <span aria-hidden>→</span>
                  </Link>
                </div>
                <Motif kind={c.k} accent={c.accent} />
              </motion.article>
            </div>
          ))}
        </div>
      </section>
    </MotionConfig>
  );
}

// A distinct visual per card — no two motifs alike.
function Motif({ kind, accent }: { kind: string; accent: string }) {
  if (kind === "score") {
    const axes = [["cost", 86], ["carbon", 72], ["latency", 64], ["reliability", 79]] as const;
    return (
      <div className="rounded-2xl border border-line bg-bg-raised/60 p-6">
        <div className="flex items-baseline justify-between">
          <span className="tnum text-5xl font-extrabold tracking-[-0.04em]" style={{ color: accent }}>81</span>
          <span className="font-mono text-xs uppercase tracking-wider text-ink-faint">GridScore™</span>
        </div>
        <div className="mt-5 flex flex-col gap-2.5">
          {axes.map(([n, v]) => (
            <div key={n}>
              <div className="mb-1 flex justify-between font-mono text-[11px] text-ink-faint"><span>{n}</span><span className="tnum">{v}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line/70"><div className="h-full rounded-full" style={{ width: `${v}%`, background: accent }} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "route") {
    const modes = ["Lowest cost", "Fastest", "Greenest", "Balanced"];
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {modes.map((m, i) => (
          <div key={m} className={`rounded-xl border p-4 ${i === 0 ? "" : "border-line bg-bg-raised/50"}`} style={i === 0 ? { borderColor: accent + "66", background: accent + "12" } : undefined}>
            <span className="h-2 w-2 rounded-sm" style={{ background: i === 0 ? accent : "#4b3a2b", display: "inline-block" }} />
            <div className="mt-3 font-sans text-sm font-semibold" style={{ color: i === 0 ? accent : "#b0a594" }}>{m}</div>
            {i === 0 && <div className="mt-0.5 font-mono text-[10px] text-ink-faint">selected</div>}
          </div>
        ))}
      </div>
    );
  }
  if (kind === "deploy") {
    const steps = ["Reserve capacity", "Drain old region", "Reroute traffic", "Verify GridScore ↑"];
    return (
      <div className="rounded-2xl border border-line bg-bg-raised/60 p-6 font-mono text-xs">
        {steps.map((s, i) => (
          <div key={s} className={`flex items-center gap-2.5 py-1.5 ${i < steps.length - 1 ? "text-ink-muted" : "text-ink-faint"}`}>
            <span style={{ color: accent }}>✓</span> {s}
          </div>
        ))}
        <div className="mt-3 border-t border-line pt-3" style={{ color: accent }}>routing live · saving $144k/mo</div>
      </div>
    );
  }
  // guard — forecast spark + alert
  return (
    <div className="rounded-2xl border border-line bg-bg-raised/60 p-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Forecast · 30d</div>
          <div className="tnum mt-1 text-2xl font-bold text-ink-bright">$612k</div>
        </div>
        <svg width="120" height="44" viewBox="0 0 120 44" className="overflow-visible">
          <path d="M0 36 L20 30 L40 33 L60 22 L80 26 L100 14 L120 9" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-line-bright px-3 py-2 font-mono text-[11px] text-ink-muted">
        <span className="h-1.5 w-1.5 animate-pulseNode rounded-full bg-brand" /> anomaly · Atlas +$50.7k
      </div>
    </div>
  );
}
