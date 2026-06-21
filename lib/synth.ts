import "server-only";
import { gpuById, hourlyRate, providerById, regionById } from "./catalog";
import { regionPriceFactor } from "./routing";
import type { UsageRow } from "./providers/types";

const DAYS = 30;

/**
 * Turn a few manual inputs into ~30 days of usage rows that sum to roughly the
 * stated monthly spend on the chosen stack — so a visitor who has no billing
 * export can still see their own numbers. Energy/carbon are estimated from the
 * catalog; nothing is fabricated beyond the spread of the spend they told us.
 */
export function synthesizeUsage(input: { monthlySpend: number; providerId: string; gpuId: string; regionId?: string }): UsageRow[] {
  const provider = providerById(input.providerId);
  const gpu = gpuById(input.gpuId);
  if (!provider || !gpu || !provider.gpuIds.includes(input.gpuId)) return [];

  const regionId = input.regionId && provider.regionIds.includes(input.regionId)
    ? input.regionId
    : provider.regionIds.includes("us-east-1") ? "us-east-1" : provider.regionIds[0];
  const region = regionById(regionId);
  if (!region) return [];

  const hourly = hourlyRate(input.gpuId, input.providerId) * regionPriceFactor(region.electricityCents);
  if (hourly <= 0) return [];

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Build a daily weight profile (weekday-heavy, gentle deterministic wobble),
  // then scale so total cost == the stated monthly spend.
  const weights: number[] = [];
  for (let d = 0; d < DAYS; d++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (DAYS - 1 - d));
    const dow = date.getUTCDay();
    const weekend = dow === 0 || dow === 6 ? 0.65 : 1;
    const wobble = 0.85 + (((d * 2654435761) >>> 0) % 30) / 100;
    weights.push(weekend * wobble);
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;

  const rows: UsageRow[] = [];
  for (let d = 0; d < DAYS; d++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (DAYS - 1 - d));
    const cost = input.monthlySpend * (weights[d] / totalWeight);
    const hours = cost / hourly;
    if (hours <= 0) continue;
    const energy = (gpu.tdpW / 1000) * hours * region.pue;
    const co2 = (energy * region.carbon) / 1000;
    rows.push({
      day: date.toISOString().slice(0, 10),
      providerId: input.providerId,
      regionId,
      gpuId: input.gpuId,
      modelId: "unknown",
      team: "My team",
      projectId: "my-workload",
      gpuHours: Math.round(hours * 10) / 10,
      cost: Math.round(cost * 100) / 100,
      energyKwh: Math.round(energy * 10) / 10,
      co2Kg: Math.round(co2 * 10) / 10,
      utilization: 0.6,
      anomaly: 0,
    });
  }
  return rows;
}
