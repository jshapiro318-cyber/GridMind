// Deterministic compute-marketplace listings derived from the catalog.
// Pure + import-safe (server or client). Later this is replaced by a live
// order book fed from provider capacity APIs.

import { GPUS, PROVIDERS, gpuById, hourlyRate, regionById } from "./catalog";
import { regionPriceFactor } from "./routing";
import { scorePlacement } from "./gridscore";

export type ListingKind = "on-demand" | "spot" | "reserved";

export interface Listing {
  id: string;
  providerId: string;
  providerShort: string;
  providerKind: string;
  accent: string;
  gpuId: string;
  gpuName: string;
  vramGB: number;
  perf: number;
  regionId: string;
  regionCity: string;
  regionCountry: string;
  carbon: number;
  renewablePct: number;
  latencyMs: number;
  kind: ListingKind;
  pricePerHr: number;
  onDemandPrice: number;
  discountPct: number;
  availableGpus: number;
  totalGpus: number;
  ecoScore: number;
  gridScore: number;
  grade: string;
  recommended: boolean;
}

const SCARCITY: Record<string, number> = {
  h200: 0.18, "mi300x": 0.22, h100: 0.4, "a100-80": 0.6, "a100-40": 0.7, l40s: 0.85, a10g: 0.95, l4: 1.0,
};
const KIND_MULT: Record<ListingKind, number> = { "on-demand": 1, spot: 0.62, reserved: 0.7 };

function cheapestRegions(providerId: string): string[] {
  const p = PROVIDERS.find((x) => x.id === providerId)!;
  return [...p.regionIds].sort((a, b) => (regionById(a)?.electricityCents ?? 99) - (regionById(b)?.electricityCents ?? 99));
}

function build(providerId: string, gpuId: string, regionId: string, kind: ListingKind): Listing | null {
  const p = PROVIDERS.find((x) => x.id === providerId);
  const g = gpuById(gpuId);
  const r = regionById(regionId);
  if (!p || !g || !r) return null;

  const onDemand = hourlyRate(gpuId, providerId) * regionPriceFactor(r.electricityCents);
  const price = onDemand * KIND_MULT[kind];
  const baseCap = p.kind === "hyperscaler" ? 1200 : 520;
  const available = Math.round(r.availability * baseCap * (SCARCITY[gpuId] ?? 0.6) * (kind === "spot" ? 1.4 : 1));
  const total = Math.round(available / Math.max(0.12, r.availability));
  const eco = Math.max(2, Math.min(100, Math.round(r.renewablePct * 0.6 + (1 - r.carbon / 700) * 40)));
  const gsc = scorePlacement(providerId, regionId);

  return {
    id: `${providerId}-${gpuId}-${regionId}-${kind}`,
    providerId,
    providerShort: p.short,
    providerKind: p.kind,
    accent: p.accent,
    gpuId,
    gpuName: g.name,
    vramGB: g.vramGB,
    perf: g.perf,
    regionId,
    regionCity: r.city,
    regionCountry: r.country,
    carbon: r.carbon,
    renewablePct: r.renewablePct,
    latencyMs: r.latencyMs,
    kind,
    pricePerHr: price,
    onDemandPrice: onDemand,
    discountPct: kind === "on-demand" ? 0 : (1 - KIND_MULT[kind]) * 100,
    availableGpus: available,
    totalGpus: total,
    ecoScore: eco,
    gridScore: gsc.score,
    grade: gsc.grade,
    recommended: false,
  };
}

let cache: Listing[] | null = null;

export function generateListings(): Listing[] {
  if (cache) return cache;
  const out: Listing[] = [];
  for (const p of PROVIDERS) {
    const regions = cheapestRegions(p.id);
    p.gpuIds.forEach((gpuId, i) => {
      const region = regions[i % Math.min(2, regions.length)];
      const l = build(p.id, gpuId, region, "on-demand");
      if (l) out.push(l);
      // Spot capacity for the in-demand accelerators.
      if (["h100", "a100-80", "h200"].includes(gpuId)) {
        const spot = build(p.id, gpuId, regions[(i + 1) % regions.length], "spot");
        if (spot) out.push(spot);
      }
      // A reserved tranche on the flagship trainer.
      if (gpuId === "h100") {
        const res = build(p.id, gpuId, region, "reserved");
        if (res) out.push(res);
      }
    });
  }
  // GridMind's pick per GPU: highest GridScore, cheapest as tiebreak.
  for (const g of GPUS) {
    const forGpu = out.filter((l) => l.gpuId === g.id && l.kind === "on-demand");
    const best = forGpu.sort((a, b) => b.gridScore - a.gridScore || a.pricePerHr - b.pricePerHr)[0];
    if (best) best.recommended = true;
  }
  cache = out;
  return out;
}

export const GPU_OPTIONS = GPUS.map((g) => ({ id: g.id, name: g.name }));
