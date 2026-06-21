// ─────────────────────────────────────────────────────────────────────────────
// GridScore™ — GridMind's signature 0–100 efficiency score.
//
// Scores any compute *placement* (a provider in a region) on four axes the
// market actually cares about: cost efficiency, carbon, latency, reliability.
// A placement's quality is about WHERE and WHO, not which GPU — so the score is
// GPU-independent and composes cleanly into provider- and company-level scores.
//
// Pure + import-safe (server and client).
// ─────────────────────────────────────────────────────────────────────────────

import { PROVIDERS, REGIONS, providerById, regionById } from "./catalog";
import { regionPriceFactor } from "./routing";

export interface GridScoreBreakdown {
  cost: number;
  carbon: number;
  latency: number;
  reliability: number;
}

export interface GridScore {
  score: number;
  grade: string;
  breakdown: GridScoreBreakdown;
}

export const GRIDSCORE_WEIGHTS = { cost: 0.4, carbon: 0.25, latency: 0.15, reliability: 0.2 };

export const SCORE_AXES: { key: keyof GridScoreBreakdown; label: string; accent: string }[] = [
  { key: "cost", label: "Cost efficiency", accent: "#ffd97a" },
  { key: "carbon", label: "Carbon", accent: "#3fe39a" },
  { key: "latency", label: "Latency", accent: "#ff9a5c" },
  { key: "reliability", label: "Reliability", accent: "#b08cff" },
];

const clamp = (n: number) => Math.max(0, Math.min(100, n));

// Reference ranges across the whole network.
const MIN_CARBON = Math.min(...REGIONS.map((r) => r.carbon));
const MAX_CARBON = Math.max(...REGIONS.map((r) => r.carbon));
const MIN_LAT = Math.min(...REGIONS.map((r) => r.latencyMs));
const MAX_LAT = Math.max(...REGIONS.map((r) => r.latencyMs));
const MIN_MULT = Math.min(...PROVIDERS.map((p) => p.priceMult));
const MIN_FACTOR = Math.min(...REGIONS.map((r) => regionPriceFactor(r.electricityCents)));
const CHEAPEST = MIN_MULT * MIN_FACTOR;

export function gradeOf(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/** GridScore for a single placement (provider × region). GPU-independent. */
export function scorePlacement(providerId: string, regionId: string): GridScore {
  const p = providerById(providerId);
  const r = regionById(regionId);
  if (!p || !r) return { score: 0, grade: "F", breakdown: { cost: 0, carbon: 0, latency: 0, reliability: 0 } };

  // Cost efficiency: how close this placement is to the cheapest possible blend
  // (the GPU price cancels, leaving provider × region efficiency).
  const here = p.priceMult * regionPriceFactor(r.electricityCents);
  const cost = clamp(100 * (CHEAPEST / here));
  const carbon = clamp(100 * (1 - (r.carbon - MIN_CARBON) / (MAX_CARBON - MIN_CARBON)));
  const latency = clamp(100 * (1 - (r.latencyMs - MIN_LAT) / (MAX_LAT - MIN_LAT)));
  const reliabilityBase = p.kind === "hyperscaler" ? 0.96 : 0.9;
  const reliability = clamp(100 * (0.7 * reliabilityBase + 0.3 * r.availability));

  const score = Math.round(
    GRIDSCORE_WEIGHTS.cost * cost +
      GRIDSCORE_WEIGHTS.carbon * carbon +
      GRIDSCORE_WEIGHTS.latency * latency +
      GRIDSCORE_WEIGHTS.reliability * reliability
  );
  return {
    score,
    grade: gradeOf(score),
    breakdown: { cost: Math.round(cost), carbon: Math.round(carbon), latency: Math.round(latency), reliability: Math.round(reliability) },
  };
}

/** Weighted blend of scored placements into one composite (org / provider). */
export function blendScores(parts: { weight: number; score: GridScore }[]): GridScore {
  const total = parts.reduce((s, p) => s + p.weight, 0) || 1;
  const acc: GridScoreBreakdown = { cost: 0, carbon: 0, latency: 0, reliability: 0 };
  for (const part of parts) {
    const w = part.weight / total;
    acc.cost += part.score.breakdown.cost * w;
    acc.carbon += part.score.breakdown.carbon * w;
    acc.latency += part.score.breakdown.latency * w;
    acc.reliability += part.score.breakdown.reliability * w;
  }
  const score = Math.round(
    GRIDSCORE_WEIGHTS.cost * acc.cost +
      GRIDSCORE_WEIGHTS.carbon * acc.carbon +
      GRIDSCORE_WEIGHTS.latency * acc.latency +
      GRIDSCORE_WEIGHTS.reliability * acc.reliability
  );
  return {
    score,
    grade: gradeOf(score),
    breakdown: { cost: Math.round(acc.cost), carbon: Math.round(acc.carbon), latency: Math.round(acc.latency), reliability: Math.round(acc.reliability) },
  };
}

/** A provider's overall GridScore — its best region for each, blended evenly. */
export function scoreProvider(providerId: string): GridScore {
  const p = providerById(providerId);
  if (!p) return { score: 0, grade: "F", breakdown: { cost: 0, carbon: 0, latency: 0, reliability: 0 } };
  const parts = p.regionIds.map((rid) => ({ weight: 1, score: scorePlacement(providerId, rid) }));
  return blendScores(parts);
}

export function scoreColor(score: number): string {
  if (score >= 85) return "#3fe39a";
  if (score >= 70) return "#ff9a5c";
  if (score >= 60) return "#ffd97a";
  return "#ff5d5d";
}
