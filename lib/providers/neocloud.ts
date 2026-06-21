import "server-only";
import { REGIONS } from "@/lib/catalog";
import { GPU_WATTS, mapRegion, type CostProvider, type ProviderStatus, type UsageRow } from "./types";
import { regionById } from "@/lib/catalog";

// ── Neocloud adapter — REAL, read-only, generic feed ─────────────────────────
// Neoclouds (CoreWeave, Lambda, Crusoe, Together, RunPod, …) each expose cost
// differently and most have no standard "daily cost" API. So this adapter is a
// generic, key-authenticated JSON feed: point each one at its provider endpoint
// (or your own small exporter) that returns daily rows. Configure via env:
//
//   GRIDMIND_NEOCLOUD_FEEDS = [
//     { "id": "runpod", "url": "https://…", "key": "…",
//       "providerId": "runpod" }            // providerId must be a catalog id
//   ]
//
// Each feed must return JSON: [{ "day":"2026-06-01", "cost": 1234.5,
//   "region"?: "us-east-1", "gpu"?: "h100", "gpuHours"?: 120 }, …]

interface Feed { id: string; url: string; key?: string; providerId: string }

const KNOWN = new Set(REGIONS.map((r) => r.id));

function feeds(): Feed[] {
  const raw = process.env.GRIDMIND_NEOCLOUD_FEEDS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Feed[];
    return Array.isArray(parsed) ? parsed.filter((f) => f.url && f.providerId) : [];
  } catch {
    return [];
  }
}

function configured(): boolean {
  return feeds().length > 0;
}

function estimate(gpu: string, gpuHours: number, regionId: string): { kwh: number; co2: number } {
  const w = GPU_WATTS[gpu]; const r = regionById(regionId);
  if (!w || !r || gpuHours <= 0) return { kwh: 0, co2: 0 };
  const kwh = (w / 1000) * gpuHours * (r.pue ?? 1.2);
  return { kwh, co2: (kwh * (r.carbon ?? 0)) / 1000 };
}

async function fetchUsage(): Promise<UsageRow[]> {
  const out: UsageRow[] = [];
  await Promise.all(feeds().map(async (f) => {
    try {
      const res = await fetch(f.url, { headers: f.key ? { Authorization: `Bearer ${f.key}` } : {} });
      if (!res.ok) return;
      const rows = (await res.json()) as { day: string; cost: number; region?: string; gpu?: string; gpuHours?: number }[];
      for (const r of rows ?? []) {
        if (!r.day || !(r.cost > 0)) continue;
        const regionId = r.region ? mapRegion(r.region.toLowerCase(), KNOWN) : "unknown";
        const gpu = r.gpu ?? "unknown";
        const gpuHours = r.gpuHours ?? 0;
        const { kwh, co2 } = estimate(gpu, gpuHours, regionId);
        out.push({
          day: r.day.slice(0, 10), providerId: f.providerId, regionId, gpuId: gpu, modelId: "unknown",
          team: "untagged", projectId: "untagged", gpuHours, cost: r.cost, energyKwh: kwh, co2Kg: co2, utilization: 0, anomaly: 0,
        });
      }
    } catch {
      /* a single bad feed shouldn't break the others */
    }
  }));
  return out;
}

export const neocloudProvider: CostProvider = {
  id: "neocloud",
  label: "Neoclouds",
  configured,
  status(): ProviderStatus {
    const n = feeds().length;
    return {
      id: "neocloud", label: "Neoclouds", configured: n > 0, mode: "read-only",
      detail: n > 0 ? `${n} feed${n > 1 ? "s" : ""} connected` : "Set GRIDMIND_NEOCLOUD_FEEDS (JSON: provider cost feeds)",
    };
  },
  fetchUsage: () => fetchUsage(),
};
