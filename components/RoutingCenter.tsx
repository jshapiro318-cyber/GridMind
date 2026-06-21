"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Allocation } from "@/lib/routingcenter";
import { MODES, type Mode } from "@/lib/routing";
import { co2, num, usd } from "@/lib/format";
import { GridScoreGauge, ScoreChip } from "./GridScore";

type RecMap = Record<Mode, Allocation>;

export function RoutingCenter({
  current,
  recommended,
  defaultMode = "balanced",
  constrained,
}: {
  current: Allocation;
  recommended: RecMap;
  defaultMode?: Mode;
  constrained?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [step, setStep] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rec = recommended[mode];
  // GridMind generates a routing PLAN — it never executes moves — so the left
  // column always shows what's actually running today.
  const savings = current.totalCost - rec.totalCost;
  const savingsPct = current.totalCost > 0 ? (savings / current.totalCost) * 100 : 0;
  const gridDelta = rec.gridScore.score - current.gridScore.score;
  const carbonCut = current.carbonKg > 0 ? ((current.carbonKg - rec.carbonKg) / current.carbonKg) * 100 : 0;

  const steps = useMemo(() => {
    const places = rec.items.filter((i) => i.key !== "other").slice(0, 3);
    return [
      ...places.map((p) => `Pricing capacity · ${p.providerShort} · ${p.regionCity}`),
      "Mapping workloads to move off high-cost regions",
      "Sequencing a zero-downtime cutover",
      "Estimating reservation & commitment changes",
      `Projecting GridScore uplift → ${rec.gridScore.score}`,
    ];
  }, [rec]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const buildPlan = () => {
    if (phase === "running") return;
    setPhase("running");
    setStep(0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduce ? 120 : 720;
    let i = 0;
    const tick = () => {
      i += 1;
      if (i > steps.length) {
        setPhase("done");
        return;
      }
      setStep(i);
      timer.current = setTimeout(tick, delay);
    };
    timer.current = setTimeout(tick, reduce ? 80 : 520);
  };

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setPhase("idle");
    setStep(0);
  };

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
      {/* Mode selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-faint">Optimize for</span>
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); reset(); }}
            className={`press rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === m.id ? "border-brand/40 bg-brand/10 text-brand" : "border-line text-ink-muted hover:border-line-bright hover:text-ink"
            }`}
          >
            {m.label}
          </button>
        ))}
        {constrained && (
          <Link
            href="/settings"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-brass/30 px-2.5 py-1.5 text-xs text-brass transition-colors hover:border-brass/50"
            title="Recommendations are limited to your allowed providers, regions and latency"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brass" />
            Respecting your constraints
          </Link>
        )}
      </div>

      {/* Outcome hero */}
      <div className="relative overflow-hidden rounded-2xl border border-brass/30 bg-bg-card p-6">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brass/10 blur-3xl" />
        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="stat-label text-brass">{phase === "done" ? "Routing plan ready" : "Recommended re-routing"}</div>
            <div className="mt-1.5 flex flex-wrap items-end gap-x-4 gap-y-1">
              <span className="tnum text-4xl font-semibold tracking-tight text-brass">{usd(savings)}</span>
              <span className="mb-1 text-sm text-ink-muted">/ month {phase === "done" ? "projected savings" : "savings"} · {savingsPct.toFixed(0)}% lower</span>
            </div>
            <p className="mt-2 max-w-lg text-sm text-ink-muted">
              {phase === "done"
                ? `Plan covers ${rec.items.filter((i) => i.key !== "other").length} optimal placements — projected ${carbonCut.toFixed(0)}% less carbon, GridScore ${rec.gridScore.score}. Apply it in your own console or IaC.`
                : `Move from ${current.items.filter((i) => i.key !== "other").length} legacy placements to GridMind's optimal mix — ${usd(rec.totalCost)}/mo, ${carbonCut.toFixed(0)}% less carbon, no performance loss.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Stat label="Monthly cost" value={`${usd(current.totalCost, { compact: true })} → ${usd(rec.totalCost, { compact: true })}`} />
              <Stat label="Carbon" value={`${co2(current.carbonKg)} → ${co2(rec.carbonKg)}`} />
              <Stat label="GPU-hours" value={num(rec.gpuHours)} />
            </div>
          </div>

          {/* GridScore before → after */}
          <div className="flex items-center justify-center gap-4 rounded-xl border border-line bg-bg-raised/60 p-4">
            <GridScoreGauge score={current.gridScore.score} grade={current.gridScore.grade} size={108} label="Current" />
            <div className="flex flex-col items-center text-brass">
              <span className="text-xl">→</span>
              <span className="tnum text-xs font-semibold">+{gridDelta}</span>
            </div>
            <GridScoreGauge score={rec.gridScore.score} grade={rec.gridScore.grade} size={108} label={phase === "done" ? "Projected" : "Optimized"} />
          </div>
        </div>
      </div>

      {/* Deploy action / console */}
      <div className="card card-pad">
        {phase === "idle" && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-ink">Generate the routing plan</h3>
              <p className="mt-0.5 text-xs text-ink-faint">GridMind builds a step-by-step migration plan for your team to apply. Recommendation only — it never moves workloads or touches your cloud account.</p>
            </div>
            <button onClick={buildPlan} className="press group inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-bg hover:brightness-110">
              Generate routing plan
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
          </div>
        )}
        {phase !== "idle" && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight text-ink">{phase === "done" ? "Routing plan ready" : "Building routing plan…"}</h3>
              {phase === "done" && (
                <button onClick={reset} className="press rounded-md border border-line px-2.5 py-1 text-xs text-ink-muted hover:text-ink">
                  Reset
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1.5 font-mono text-xs">
              {steps.map((s, i) => {
                const state = i < step ? "done" : i === step && phase === "running" ? "active" : "pending";
                return (
                  <div key={i} className={`flex items-center gap-2.5 ${state === "pending" ? "text-ink-faint" : "text-ink-muted"}`}>
                    <span className="w-3.5 shrink-0">
                      {state === "done" ? (
                        <span className="text-leaf">✓</span>
                      ) : state === "active" ? (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border border-brand border-t-transparent" />
                      ) : (
                        <span className="text-ink-faint">·</span>
                      )}
                    </span>
                    <span>{s}</span>
                  </div>
                );
              })}
              {phase === "done" && (
                <div className="mt-2 flex items-center gap-2.5 text-leaf">
                  <span className="w-3.5 shrink-0">✓</span>
                  <span>Plan ready — projected {usd(savings)}/mo saved · GridScore {current.gridScore.score} → {rec.gridScore.score}. Apply via your IaC or console.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current vs recommended allocation */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AllocationColumn
          title="Current routing"
          sub="How your workloads run today"
          alloc={current}
        />
        <AllocationColumn
          title={phase === "done" ? "Planned routing" : "Recommended routing"}
          sub={`Optimized for ${MODES.find((m) => m.id === mode)?.label.toLowerCase()}`}
          alloc={rec}
          highlight
          planned={phase === "done"}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg-raised px-3 py-2">
      <div className="stat-label">{label}</div>
      <div className="tnum mt-0.5 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function AllocationColumn({ title, sub, alloc, highlight, planned }: { title: string; sub: string; alloc: Allocation; highlight?: boolean; planned?: boolean }) {
  const max = Math.max(...alloc.items.map((i) => i.sharePct), 1);
  return (
    <div className={`card card-pad ${highlight && !planned ? "border-brand/30" : ""} ${planned ? "border-leaf/30" : ""}`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
            {title}
            {planned && <span className="rounded-full bg-leaf/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-leaf">Plan ready</span>}
            {highlight && !planned && <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand">Recommended</span>}
          </h3>
          <p className="mt-0.5 text-xs text-ink-faint">{sub}</p>
        </div>
        <div className="text-right">
          <div className="tnum text-base font-semibold text-ink">{usd(alloc.totalCost, { compact: true })}</div>
          <div className="text-[10px] uppercase tracking-wider text-ink-faint">/ month</div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {alloc.items.map((it) => (
          <div key={it.key}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: it.accent }} />
                <span className="truncate text-ink">{it.providerShort}</span>
                <span className="truncate text-ink-faint">{it.regionCity}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <ScoreChip score={it.gridScore} />
                <span className="tnum w-10 text-right text-ink-muted">{it.sharePct.toFixed(0)}%</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/60">
              <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${(it.sharePct / max) * 100}%`, background: it.accent }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
