// ─────────────────────────────────────────────────────────────────────────────
// GridMind AI Routing Engine
//
// Pure scoring functions that rank every viable (provider × region) placement
// for a workload under four optimization modes. No I/O, no framework — safe to
// import on the server (dashboard routing panel) or the client (live simulator).
// ─────────────────────────────────────────────────────────────────────────────

import { GPUS, PROVIDERS, REGIONS, gpuById, hourlyRate, providerById, regionById } from "./catalog";

export type Mode = "cost" | "speed" | "carbon" | "balanced";

export const MODES: { id: Mode; label: string; blurb: string; accent: string }[] = [
  { id: "cost", label: "Lowest Cost", blurb: "Minimize spend per GPU-hour", accent: "#ecb84c" },
  { id: "speed", label: "Fastest Speed", blurb: "Maximize throughput, minimize latency", accent: "#ff9a5c" },
  { id: "carbon", label: "Lowest Carbon", blurb: "Greenest grid, least CO₂", accent: "#3fe39a" },
  { id: "balanced", label: "Balanced", blurb: "Best overall cost / speed / carbon", accent: "#b08cff" },
];

// Per-mode axis weights (each row sums to 1.0). NOTE: the `speed` (raw GPU perf)
// axis is intentionally 0 — bestRoute always ranks placements for ONE GPU, and a
// GPU's perf is identical at every location, so perf can't differentiate
// placements. The signal that actually represents "fast" across locations is
// network LATENCY, so the Fastest mode is latency-driven (with availability as a
// throughput/queueing proxy). Each mode is dominated by its named objective so
// the four produce genuinely distinct recommendations.
const WEIGHTS: Record<Mode, { cost: number; carbon: number; speed: number; avail: number; latency: number }> = {
  cost: { cost: 0.8, carbon: 0.05, speed: 0.0, avail: 0.08, latency: 0.07 },
  speed: { cost: 0.05, carbon: 0.0, speed: 0.0, avail: 0.0, latency: 0.95 },
  carbon: { cost: 0.07, carbon: 0.88, speed: 0.0, avail: 0.05, latency: 0.0 },
  balanced: { cost: 0.34, carbon: 0.26, speed: 0.0, avail: 0.14, latency: 0.26 },
};

/**
 * Regional price adjustment around a 12¢/kWh baseline. Cheap-power regions get a
 * discount on the effective hourly rate; expensive grids cost a premium.
 */
export function regionPriceFactor(electricityCents: number): number {
  const f = 0.9 + (electricityCents - 12) * 0.012;
  return Math.min(1.18, Math.max(0.82, f));
}

export interface WorkloadSpec {
  gpuId: string;
  gpuCount: number;
  hours: number; // hours per month
  mode: Mode;
}

export interface Candidate {
  providerId: string;
  regionId: string;
  hourly: number;
  monthlyCost: number;
  energyKwh: number;
  co2Kg: number;
  latencyMs: number;
  availability: number;
  perf: number;
  score: number; // 0–100
}

export interface RouteConstraints {
  /** Restrict placement to these providers. Empty / undefined = all providers. */
  allowedProviders?: string[];
  /** Restrict placement to these regions (e.g. data-residency). Empty / undefined = all. */
  allowedRegions?: string[];
  /** Hard ceiling on representative network latency, ms. null / undefined = no cap. */
  maxLatencyMs?: number | null;
}

/**
 * Apply the user's routing constraints to a candidate set. Constraints are a
 * SOFT filter: if a rule would eliminate every remaining placement we skip that
 * rule rather than return nothing — the engine never leaves a workload unplaced.
 */
function applyConstraints<T extends { providerId: string; regionId: string; latencyMs: number }>(
  cands: T[],
  c?: RouteConstraints
): T[] {
  if (!c) return cands;
  let f = cands;
  if (c.allowedProviders?.length) {
    const next = f.filter((x) => c.allowedProviders!.includes(x.providerId));
    if (next.length) f = next;
  }
  if (c.allowedRegions?.length) {
    const next = f.filter((x) => c.allowedRegions!.includes(x.regionId));
    if (next.length) f = next;
  }
  if (c.maxLatencyMs != null) {
    const next = f.filter((x) => x.latencyMs <= c.maxLatencyMs!);
    if (next.length) f = next;
  }
  return f;
}

function rawCandidates(spec: WorkloadSpec): Omit<Candidate, "score">[] {
  const gpu = gpuById(spec.gpuId);
  if (!gpu) return [];
  const out: Omit<Candidate, "score">[] = [];

  for (const p of PROVIDERS) {
    if (!p.gpuIds.includes(spec.gpuId)) continue;
    for (const rId of p.regionIds) {
      const r = regionById(rId);
      if (!r) continue;
      const hourly = hourlyRate(spec.gpuId, p.id) * regionPriceFactor(r.electricityCents);
      const monthlyCost = hourly * spec.gpuCount * spec.hours;
      const energyKwh = (gpu.tdpW / 1000) * spec.gpuCount * spec.hours * r.pue;
      const co2Kg = (energyKwh * r.carbon) / 1000;
      out.push({
        providerId: p.id,
        regionId: r.id,
        hourly,
        monthlyCost,
        energyKwh,
        co2Kg,
        latencyMs: r.latencyMs,
        availability: r.availability,
        perf: gpu.perf,
      });
    }
  }
  return out;
}

/**
 * Min–max normalize a value onto [0,1] where 1 is best, relative to the spread
 * of the current candidate set. When an axis has no spread (e.g. perf is the
 * same across every placement of one GPU) it can't differentiate placements, so
 * it returns a neutral 1 rather than penalising or dominating anyone.
 *
 * Using a CONSISTENT per-axis range is what makes the mode weights honest: the
 * old `min/value` ratios gave carbon a ~25× wider spread than cost (carbon
 * ranges 24→708 g, but cost is clamped to a ~1.2× band), so any mode with real
 * carbon weight collapsed onto the greenest region — making Balanced identical
 * to Lowest Carbon. Min–max puts every axis on the same 0–1 footing.
 */
function unit(value: number, min: number, max: number, higherIsBetter: boolean): number {
  if (max - min < 1e-9) return 1;
  const t = (value - min) / (max - min);
  return higherIsBetter ? t : 1 - t;
}

/** Rank all viable placements for a workload under the chosen mode, honouring optional constraints. */
export function candidatesFor(spec: WorkloadSpec, constraints?: RouteConstraints): Candidate[] {
  const raw = applyConstraints(rawCandidates(spec), constraints);
  if (raw.length === 0) return [];

  const costs = raw.map((c) => c.monthlyCost);
  const co2s = raw.map((c) => c.co2Kg);
  const lats = raw.map((c) => c.latencyMs);
  const perfs = raw.map((c) => c.perf);
  const avails = raw.map((c) => c.availability);
  const minCost = Math.min(...costs), maxCost = Math.max(...costs);
  const minCo2 = Math.min(...co2s), maxCo2 = Math.max(...co2s);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minPerf = Math.min(...perfs), maxPerf = Math.max(...perfs);
  const minAvail = Math.min(...avails), maxAvail = Math.max(...avails);
  const w = WEIGHTS[spec.mode];

  const scored = raw.map((c) => {
    const costBetter = unit(c.monthlyCost, minCost, maxCost, false);
    const carbonBetter = unit(c.co2Kg, minCo2, maxCo2, false);
    const speedBetter = unit(c.perf, minPerf, maxPerf, true);
    const latencyBetter = unit(c.latencyMs, minLat, maxLat, false);
    const availBetter = unit(c.availability, minAvail, maxAvail, true);
    const score =
      (w.cost * costBetter +
        w.carbon * carbonBetter +
        w.speed * speedBetter +
        w.latency * latencyBetter +
        w.avail * availBetter) *
      100;
    return { ...c, score };
  });

  return scored.sort((a, b) => b.score - a.score);
}

export interface RouteResult {
  best: Candidate;
  runnerUp?: Candidate;
  candidates: Candidate[];
  /** Status-quo placement most teams default to (hyperscaler in N. Virginia). */
  baseline: Candidate;
}

export function bestRoute(spec: WorkloadSpec, constraints?: RouteConstraints): RouteResult | null {
  const candidates = candidatesFor(spec, constraints);
  if (candidates.length === 0) return null;
  // Baseline = the status-quo placement, drawn from ALL placements (not just the
  // constrained set) so "savings vs the hyperscaler default" stays honest even
  // when the user's constraints shrink the available options.
  const all = constraints ? candidatesFor(spec) : candidates;
  const baseline =
    all.find((c) => c.regionId === "us-east-1" && providerById(c.providerId)?.kind === "hyperscaler") ??
    all.reduce((a, b) => (a.monthlyCost > b.monthlyCost ? a : b));
  return { best: candidates[0], runnerUp: candidates[1], candidates, baseline };
}

// ── Savings Simulator ────────────────────────────────────────────────────────

export interface SimInput {
  monthlySpend: number;
  gpuIds: string[];
  providerIds: string[];
  modelIds: string[];
  mode: Mode;
  /** Optional destination constraints (allowed providers/regions, latency cap). */
  constraints?: RouteConstraints;
}

export interface GpuRouting {
  gpuId: string;
  gpuName: string;
  fromProvider: string;
  fromRegion: string;
  toProvider: string;
  toRegion: string;
  fromHourly: number;
  toHourly: number;
  savingsPct: number;
}

export interface SimResult {
  currentSpend: number;
  optimizedSpend: number;
  savingsUsd: number;
  savingsPct: number;
  energyBeforeKwh: number;
  energyAfterKwh: number;
  energyReductionPct: number;
  co2BeforeKg: number;
  co2AfterKg: number;
  co2ReductionPct: number;
  performanceDeltaPct: number;
  impliedGpuHours: number;
  routings: GpuRouting[];
}

/** Status-quo placement for a provider+gpu: their N. Virginia footprint if present. */
function baselinePlacement(providerId: string, gpuId: string) {
  const p = providerById(providerId);
  if (!p) return null;
  const regionId = p.regionIds.includes("us-east-1") ? "us-east-1" : p.regionIds[0];
  const r = regionById(regionId);
  if (!r) return null;
  const hourly = hourlyRate(gpuId, providerId) * regionPriceFactor(r.electricityCents);
  return { region: r, hourly };
}

/**
 * Back out the implied GPU-hours from the user's current monthly spend, then
 * re-route those hours optimally under the selected mode.
 */
export function simulateSavings(input: SimInput): SimResult {
  const gpuIds = input.gpuIds.length ? input.gpuIds : ["h100"];
  const providerIds = input.providerIds.length ? input.providerIds : ["aws"];

  // 1. Establish the blended status-quo hourly rate across the user's stack.
  const baseRates: number[] = [];
  const baseRegions: { pue: number; carbon: number }[] = [];
  for (const gId of gpuIds) {
    for (const pId of providerIds) {
      if (!providerById(pId)?.gpuIds.includes(gId)) continue;
      const bp = baselinePlacement(pId, gId);
      if (!bp) continue;
      baseRates.push(bp.hourly);
      baseRegions.push({ pue: bp.region.pue, carbon: bp.region.carbon });
    }
  }
  const baselineHourly = baseRates.length ? baseRates.reduce((a, b) => a + b, 0) / baseRates.length : hourlyRate("h100", "aws");
  const impliedGpuHours = baselineHourly > 0 ? input.monthlySpend / baselineHourly : 0;

  // Weighted-average board power across selected GPUs (for energy accounting).
  const avgTdp = gpuIds.reduce((s, g) => s + (gpuById(g)?.tdpW ?? 400), 0) / gpuIds.length;
  const avgBasePue = baseRegions.length ? baseRegions.reduce((s, r) => s + r.pue, 0) / baseRegions.length : 1.2;
  const avgBaseCarbon = baseRegions.length ? baseRegions.reduce((s, r) => s + r.carbon, 0) / baseRegions.length : 380;

  // 2. Re-route each GPU type optimally. Hours split evenly across GPU types.
  const hoursPer = impliedGpuHours / gpuIds.length;
  const routings: GpuRouting[] = [];
  const optRates: number[] = [];
  let optPueSum = 0;
  let optCarbonSum = 0;
  let latencyDeltaSum = 0;
  let availSum = 0;

  for (const gId of gpuIds) {
    const route = bestRoute({ gpuId: gId, gpuCount: 1, hours: Math.max(1, hoursPer), mode: input.mode }, input.constraints);
    if (!route) continue;
    const best = route.best;
    const bestRegion = regionById(best.regionId)!;

    // From = the cheapest status-quo placement among the user's providers.
    const fromPid = providerIds.find((p) => providerById(p)?.gpuIds.includes(gId)) ?? providerIds[0];
    const fromBp = baselinePlacement(fromPid, gId);
    const fromHourly = fromBp?.hourly ?? best.hourly;
    const fromRegion = fromBp?.region ?? bestRegion;

    optRates.push(best.hourly);
    optPueSum += bestRegion.pue;
    optCarbonSum += bestRegion.carbon;
    latencyDeltaSum += bestRegion.latencyMs - (fromRegion?.latencyMs ?? bestRegion.latencyMs);
    availSum += best.availability;

    routings.push({
      gpuId: gId,
      gpuName: gpuById(gId)?.name ?? gId,
      fromProvider: providerById(fromPid)?.short ?? fromPid,
      fromRegion: fromRegion?.name ?? "—",
      toProvider: providerById(best.providerId)?.short ?? best.providerId,
      toRegion: bestRegion.name,
      fromHourly,
      toHourly: best.hourly,
      savingsPct: fromHourly > 0 ? ((fromHourly - best.hourly) / fromHourly) * 100 : 0,
    });
  }

  const optimizedHourly = optRates.length ? optRates.reduce((a, b) => a + b, 0) / optRates.length : baselineHourly;
  const optimizedSpend = impliedGpuHours * optimizedHourly;
  const savingsUsd = input.monthlySpend - optimizedSpend;
  const savingsPct = input.monthlySpend > 0 ? (savingsUsd / input.monthlySpend) * 100 : 0;

  const optPue = routings.length ? optPueSum / routings.length : avgBasePue;
  const optCarbon = routings.length ? optCarbonSum / routings.length : avgBaseCarbon;

  const energyBeforeKwh = (avgTdp / 1000) * impliedGpuHours * avgBasePue;
  const energyAfterKwh = (avgTdp / 1000) * impliedGpuHours * optPue;
  const energyReductionPct = energyBeforeKwh > 0 ? ((energyBeforeKwh - energyAfterKwh) / energyBeforeKwh) * 100 : 0;

  const co2BeforeKg = (energyBeforeKwh * avgBaseCarbon) / 1000;
  const co2AfterKg = (energyAfterKwh * optCarbon) / 1000;
  const co2ReductionPct = co2BeforeKg > 0 ? ((co2BeforeKg - co2AfterKg) / co2BeforeKg) * 100 : 0;

  // Performance: more spare capacity → less queueing (faster); added latency hurts.
  const avgLatencyDelta = routings.length ? latencyDeltaSum / routings.length : 0;
  const avgAvail = routings.length ? availSum / routings.length : 0.6;
  const performanceDeltaPct = (avgAvail - 0.55) * 22 - avgLatencyDelta * 0.05;

  return {
    currentSpend: input.monthlySpend,
    optimizedSpend,
    savingsUsd,
    savingsPct,
    energyBeforeKwh,
    energyAfterKwh,
    energyReductionPct,
    co2BeforeKg,
    co2AfterKg,
    co2ReductionPct,
    performanceDeltaPct,
    impliedGpuHours,
    routings,
  };
}

export const ALL_GPUS = GPUS;
export const ALL_REGIONS = REGIONS;
