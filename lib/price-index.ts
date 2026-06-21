// ─────────────────────────────────────────────────────────────────────────────
// GPU price index — the public, cross-cloud $/hr comparison.
//
// IMPORTANT (honesty): these are MODELED reference rates, not live quotes. They
// come straight from the static catalog: each GPU's public reference list price
// × a per-provider pricing multiplier × a regional power-cost factor, taking the
// cheapest qualifying region per provider. When live pricing APIs land, the same
// shapes get populated from real data. Until then every surface that renders this
// must label it as modeled / indicative. See lib/catalog.ts.
// ─────────────────────────────────────────────────────────────────────────────
import { GPUS, PROVIDERS, hourlyRate, regionById, type GpuType, type ProviderKind } from "./catalog";
import { regionPriceFactor } from "./routing";

/** When the underlying catalog list prices were last reviewed (hand-maintained). */
export const PRICE_INDEX_DATE = "June 2026";

export interface ProviderRate {
  id: string;
  name: string;
  short: string;
  kind: ProviderKind;
  /** Cheapest modeled on-demand rate this provider offers for the GPU, USD/hr. */
  rate: number;
  /** City of the region that produced that cheapest rate. */
  region: string;
}

export interface GpuPriceRow {
  gpu: GpuType;
  /** Providers that offer this GPU, cheapest first. */
  rates: ProviderRate[];
  min: number;
  max: number;
  /** How far under the priciest the cheapest sits, percent. */
  spreadPct: number;
  /** max / min, e.g. 1.83 (×). */
  spreadX: number;
  cheapest: ProviderRate;
}

/** Trim a provider's long name to a compact column label. */
export function shortProvider(name: string): string {
  return name
    .replace("Amazon Web Services", "AWS")
    .replace("Google Cloud", "GCP")
    .replace("Microsoft Azure", "Azure")
    .replace(" Labs", "")
    .replace(" AI", "");
}

/** Cheapest modeled $/hr for `gpuId` at `providerId`, across that provider's regions. */
export function bestRate(gpuId: string, providerId: string): { rate: number; region: string } | null {
  const p = PROVIDERS.find((x) => x.id === providerId);
  if (!p || !p.gpuIds.includes(gpuId)) return null;
  let best = Infinity;
  let region = "";
  for (const rid of p.regionIds) {
    const r = regionById(rid);
    if (!r) continue;
    const h = hourlyRate(gpuId, providerId) * regionPriceFactor(r.electricityCents);
    if (h < best) {
      best = h;
      region = r.city;
    }
  }
  if (!Number.isFinite(best)) return null;
  return { rate: best, region };
}

/** The full index: one row per GPU offered by ≥2 providers, each with per-provider best rates. */
export function priceIndex(): GpuPriceRow[] {
  return GPUS.map((gpu): GpuPriceRow | null => {
    const rates: ProviderRate[] = [];
    for (const p of PROVIDERS) {
      const b = bestRate(gpu.id, p.id);
      if (!b) continue;
      rates.push({ id: p.id, name: p.name, short: shortProvider(p.name), kind: p.kind, rate: b.rate, region: b.region });
    }
    rates.sort((a, b) => a.rate - b.rate);
    if (rates.length < 2) return null;
    const min = rates[0].rate;
    const max = rates[rates.length - 1].rate;
    return {
      gpu,
      rates,
      min,
      max,
      spreadPct: max > 0 ? Math.round(((max - min) / max) * 100) : 0,
      spreadX: min > 0 ? Math.round((max / min) * 100) / 100 : 0,
      cheapest: rates[0],
    };
  }).filter((r): r is GpuPriceRow => r !== null);
}

/** Best modeled rate for `gpuId` at `providerId`, or null if not offered (table cells). */
export function cellRate(gpuId: string, providerId: string): number | null {
  const b = bestRate(gpuId, providerId);
  return b ? b.rate : null;
}
