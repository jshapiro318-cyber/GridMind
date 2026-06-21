// ─────────────────────────────────────────────────────────────────────────────
// User preferences — the personalization layer.
//
// Budget target, allowed providers/regions, a latency ceiling, a workload
// profile and a default optimization mode. These are persisted per browser (a
// cookie — see preferences-actions.ts) and feed the routing engine, GridScore
// and budget views so every recommendation respects the user's own guardrails.
//
// This module is intentionally framework-agnostic and import-safe on both the
// server (pages reading prefs) and the client (the Settings form), so it holds
// only pure types/helpers — never `next/headers` or `server-only`.
// ─────────────────────────────────────────────────────────────────────────────

import type { Mode, RouteConstraints } from "./routing";

export const PREFS_COOKIE = "gm_prefs";

export interface Preferences {
  /** Monthly budget target, USD. 0 = auto (derive from recent spend). */
  monthlyBudget: number;
  /** Providers the org is allowed to use. Empty = all providers. */
  allowedProviders: string[];
  /** Regions the org is allowed to use (data residency). Empty = all regions. */
  allowedRegions: string[];
  /** Hard latency ceiling for any placement, ms. null = no cap. */
  maxLatencyMs: number | null;
  /** Representative GPU mix — seeds the simulator and the dashboard fleet. */
  gpuIds: string[];
  /** Default optimization objective. */
  mode: Mode;
}

export const DEFAULT_PREFERENCES: Preferences = {
  monthlyBudget: 0,
  allowedProviders: [],
  allowedRegions: [],
  maxLatencyMs: null,
  gpuIds: ["h100", "a100-80"],
  mode: "balanced",
};

const MODES_SET: Mode[] = ["cost", "speed", "carbon", "balanced"];

/** Latency-ceiling choices offered in the Settings form. */
export const LATENCY_OPTIONS: { label: string; value: number | null }[] = [
  { label: "No limit", value: null },
  { label: "≤ 50 ms", value: 50 },
  { label: "≤ 100 ms", value: 100 },
  { label: "≤ 150 ms", value: 150 },
];

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/** Coerce arbitrary (possibly stale/untrusted cookie) input into valid Preferences. */
export function normalizePreferences(raw: unknown): Preferences {
  const r = (raw ?? {}) as Partial<Record<keyof Preferences, unknown>>;
  const budget = Number(r.monthlyBudget);
  const latency = r.maxLatencyMs == null ? null : Number(r.maxLatencyMs);
  const gpuIds = asStringArray(r.gpuIds);
  const mode = MODES_SET.includes(r.mode as Mode) ? (r.mode as Mode) : DEFAULT_PREFERENCES.mode;
  return {
    monthlyBudget: Number.isFinite(budget) && budget > 0 ? Math.round(budget) : 0,
    allowedProviders: asStringArray(r.allowedProviders),
    allowedRegions: asStringArray(r.allowedRegions),
    maxLatencyMs: latency != null && Number.isFinite(latency) && latency > 0 ? latency : null,
    gpuIds: gpuIds.length ? gpuIds : [...DEFAULT_PREFERENCES.gpuIds],
    mode,
  };
}

/** The routing-engine view of the user's hard constraints. */
export function constraintsFrom(p: Preferences): RouteConstraints {
  return {
    allowedProviders: p.allowedProviders,
    allowedRegions: p.allowedRegions,
    maxLatencyMs: p.maxLatencyMs,
  };
}

/** True when the user has narrowed routing beyond the defaults. */
export function hasActiveConstraints(p: Preferences): boolean {
  return p.allowedProviders.length > 0 || p.allowedRegions.length > 0 || p.maxLatencyMs != null;
}
