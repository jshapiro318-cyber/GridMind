"use client";

import { useMemo, useState } from "react";
import { GPUS, MODELS, PROVIDERS } from "@/lib/catalog";
import { MODES, type Mode, type RouteConstraints, simulateSavings } from "@/lib/routing";
import { co2, kwh, num, signedPct, usd } from "@/lib/format";

const PRESETS = [50_000, 250_000, 1_000_000];

export function Simulator({
  initialGpus,
  initialMode = "balanced",
  constraints,
}: {
  initialGpus?: string[];
  initialMode?: Mode;
  constraints?: RouteConstraints;
}) {
  const [spend, setSpend] = useState(280_000);
  const [providers, setProviders] = useState<string[]>(["aws", "gcp", "azure"]);
  const [gpus, setGpus] = useState<string[]>(initialGpus?.length ? initialGpus : ["h100", "a100-80"]);
  const [models, setModels] = useState<string[]>(["llama-3.1-70b", "ft-support-13b"]);
  const [mode, setMode] = useState<Mode>(initialMode);

  const result = useMemo(
    () => simulateSavings({ monthlySpend: spend, gpuIds: gpus, providerIds: providers, modelIds: models, mode, constraints }),
    [spend, gpus, providers, models, mode, constraints]
  );

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const optimizedPctOfCurrent = result.currentSpend > 0 ? (result.optimizedSpend / result.currentSpend) * 100 : 100;
  const perfGood = result.performanceDeltaPct >= 0;
  const constrained = !!(
    constraints && (constraints.allowedProviders?.length || constraints.allowedRegions?.length || constraints.maxLatencyMs != null)
  );

  return (
    <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Inputs */}
      <div className="card card-pad lg:col-span-1">
        <h3 className="text-sm font-semibold tracking-tight text-ink">Your current setup</h3>
        <p className="mt-0.5 text-xs text-ink-faint">We back-calculate GPU-hours, then re-route them optimally.</p>

        <div className="mt-5">
          <label className="stat-label">Current monthly AI spend</label>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-lg text-ink-muted">$</span>
            <input
              type="number"
              value={spend}
              min={10_000}
              step={5_000}
              onChange={(e) => setSpend(Math.max(0, Number(e.target.value)))}
              className="tnum w-full bg-transparent text-2xl font-semibold text-ink outline-none"
            />
          </div>
          <input
            type="range"
            min={10_000}
            max={2_000_000}
            step={5_000}
            value={spend}
            onChange={(e) => setSpend(Number(e.target.value))}
            className="mt-3 w-full accent-brand"
          />
          <div className="mt-2 flex gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setSpend(p)}
                className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                  spend === p ? "border-brand/40 bg-brand/10 text-brand" : "border-line text-ink-muted hover:text-ink"
                }`}
              >
                {usd(p, { compact: true })}
              </button>
            ))}
          </div>
        </div>

        <Group label="Providers you use">
          {PROVIDERS.map((p) => (
            <Chip key={p.id} active={providers.includes(p.id)} accent={p.accent} onClick={() => toggle(providers, setProviders, p.id)}>
              {p.short}
            </Chip>
          ))}
        </Group>

        <Group label="GPU types">
          {GPUS.map((g) => (
            <Chip key={g.id} active={gpus.includes(g.id)} onClick={() => toggle(gpus, setGpus, g.id)}>
              {g.name.replace("NVIDIA ", "").replace("AMD ", "")}
            </Chip>
          ))}
        </Group>

        <Group label="Models in production">
          {MODELS.slice(0, 8).map((m) => (
            <Chip key={m.id} active={models.includes(m.id)} onClick={() => toggle(models, setModels, m.id)}>
              {m.name}
            </Chip>
          ))}
        </Group>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-5 lg:col-span-2">
        {/* Optimization mode */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`press rounded-xl border p-3 text-left transition-[box-shadow,border-color,background-color] duration-200 ease-out ${
                mode === m.id ? "border-transparent bg-bg-hover shadow-glow" : "border-line bg-bg-card hover:border-line-bright"
              }`}
              style={mode === m.id ? { boxShadow: `0 0 0 1px ${m.accent}55, 0 0 24px -8px ${m.accent}` } : undefined}
            >
              <div className="text-sm font-semibold" style={{ color: mode === m.id ? m.accent : "#ece4d8" }}>
                {m.label}
              </div>
              <div className="mt-0.5 text-[11px] leading-tight text-ink-faint">{m.blurb}</div>
            </button>
          ))}
        </div>

        {/* Headline */}
        <div className="relative overflow-hidden rounded-2xl border border-brass/30 bg-bg-card p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brass/10 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="stat-label text-brass">Projected savings with GridMind</div>
              <div className="mt-1 flex items-end gap-3">
                <span className="tnum text-5xl font-semibold tracking-tight text-brass">{result.savingsPct.toFixed(1)}%</span>
                <span className="tnum mb-1.5 text-lg text-leaf">{usd(result.savingsUsd)}/mo</span>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {usd(result.optimizedSpend)} optimized vs {usd(result.currentSpend)} today ·{" "}
                <span className="tnum font-medium text-ink">{usd(result.savingsUsd * 12)}</span> saved per year
              </p>
            </div>
            <div className="text-right">
              <div className="stat-label">Implied scale</div>
              <div className="tnum text-sm font-medium text-ink">{num(result.impliedGpuHours)} GPU-hrs/mo</div>
            </div>
          </div>

          {/* before / after bar */}
          <div className="relative mt-5 space-y-2">
            <BeforeAfter label="Current spend" value={result.currentSpend} max={result.currentSpend} plain />
            <BeforeAfter label="Optimized spend" value={result.optimizedSpend} max={result.currentSpend} pct={optimizedPctOfCurrent} />
          </div>
        </div>

        {/* Impact cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Impact title="Energy reduction" main={signedPct(-result.energyReductionPct)} sub={`${kwh(result.energyBeforeKwh)} → ${kwh(result.energyAfterKwh)}`} good={result.energyReductionPct >= 0} />
          <Impact title="Carbon reduction" main={signedPct(-result.co2ReductionPct)} sub={`${co2(result.co2BeforeKg)} → ${co2(result.co2AfterKg)}`} good={result.co2ReductionPct >= 0} />
          <Impact title="Performance impact" main={signedPct(result.performanceDeltaPct)} sub={perfGood ? "throughput maintained / better" : "minor latency tradeoff"} good={perfGood} />
        </div>

        {/* Routing table */}
        <div className="card card-pad">
          <h3 className="mb-3 text-sm font-semibold tracking-tight text-ink">Recommended re-routing · {MODES.find((m) => m.id === mode)?.label}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-ink-faint">
                  <th className="py-2 pr-4 font-medium">GPU</th>
                  <th className="py-2 pr-4 font-medium">From</th>
                  <th className="py-2 pr-4 font-medium">To</th>
                  <th className="py-2 pr-4 font-medium">Rate</th>
                  <th className="py-2 text-right font-medium">Savings</th>
                </tr>
              </thead>
              <tbody>
                {result.routings.map((r) => (
                  <tr key={r.gpuId} className="border-b border-line/50">
                    <td className="py-2.5 pr-4 text-ink">{r.gpuName.replace("NVIDIA ", "").replace("AMD ", "")}</td>
                    <td className="py-2.5 pr-4 text-ink-muted">
                      {r.fromProvider} <span className="text-ink-faint">· {r.fromRegion.replace(/\(.*\)/, "").trim()}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-brand">{r.toProvider}</span> <span className="text-ink-faint">· {r.toRegion.replace(/\(.*\)/, "").trim()}</span>
                    </td>
                    <td className="tnum py-2.5 pr-4 text-ink-muted">
                      {usd(r.fromHourly, { cents: true })} → <span className="text-ink">{usd(r.toHourly, { cents: true })}</span>
                    </td>
                    <td className={`tnum py-2.5 text-right font-medium ${r.savingsPct >= 0 ? "text-leaf" : "text-rose"}`}>{signedPct(r.savingsPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-ink-faint">
            Estimates based on GridMind&apos;s routing engine across {PROVIDERS.length} providers and 13 regions. Actual savings depend on workload
            portability and commitments.
            {constrained ? " Routing is limited to the allowed providers, regions and latency ceiling set in your preferences." : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <label className="stat-label">{label}</label>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, accent, onClick, children }: { active: boolean; accent?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
        active ? "border-transparent bg-bg-hover text-ink" : "border-line text-ink-muted hover:border-line-bright hover:text-ink"
      }`}
      style={active ? { boxShadow: `inset 0 0 0 1px ${(accent ?? "#ecb84c") + "66"}` } : undefined}
    >
      {children}
    </button>
  );
}

function Impact({ title, main, sub, good }: { title: string; main: string; sub: string; good: boolean }) {
  return (
    <div className="card card-pad">
      <div className="stat-label">{title}</div>
      <div className={`tnum mt-1.5 text-2xl font-semibold ${good ? "text-leaf" : "text-amber"}`}>{main}</div>
      <div className="mt-1 text-xs text-ink-faint">{sub}</div>
    </div>
  );
}

function BeforeAfter({ label, value, max, pct, color = "#ecb84c", plain }: { label: string; value: number; max: number; pct?: number; color?: string; plain?: boolean }) {
  const width = pct ?? (max > 0 ? (value / max) * 100 : 0);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-ink-muted">{label}</span>
        <span className="tnum text-ink">{usd(value)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-line/60">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: plain ? "#3a2d20" : "linear-gradient(90deg,#b8801f,#ffd97a)" }} />
      </div>
    </div>
  );
}
