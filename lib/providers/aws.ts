import "server-only";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  type GetCostAndUsageCommandInput,
} from "@aws-sdk/client-cost-explorer";
import { REGIONS, regionById } from "@/lib/catalog";
import { GPU_WATTS, mapRegion, rangeStart, utcDay, type CostProvider, type ProviderStatus, type UsageRow } from "./types";

// ── AWS Cost Explorer adapter — REAL, read-only ──────────────────────────────
// Needs (the customer's own, read-only) credentials in the environment:
//   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, (optional AWS_SESSION_TOKEN)
// IAM permission required: ce:GetCostAndUsage  (read-only, nothing else).
// Optional: GRIDMIND_AWS_TEAM_TAG=Team  → groups spend by that cost-allocation tag.

const KNOWN = new Set(REGIONS.map((r) => r.id));

function gpusInSize(t: string): number {
  // g5.48xlarge → 8, g5.12xlarge → 4, g5.24xlarge → 4, else 1
  if (/\b\w*48xlarge/.test(t)) return 8;
  if (/\b\w*24xlarge/.test(t)) return 4;
  if (/\b\w*12xlarge/.test(t)) return 4;
  if (/\b\w*16xlarge/.test(t)) return 2;
  return 1;
}

/** Map an EC2 instance type to a catalog GPU id + GPUs-per-instance. */
function instanceToGpu(instanceType: string): { gpu: string; count: number } {
  const t = (instanceType || "").toLowerCase();
  const fam = t.split(".")[0];
  if (fam.startsWith("p5e")) return { gpu: "h200", count: 8 };
  if (fam.startsWith("p5")) return { gpu: "h100", count: 8 };
  if (fam.startsWith("p4de")) return { gpu: "a100-80", count: 8 };
  if (fam.startsWith("p4d")) return { gpu: "a100-40", count: 8 };
  if (fam.startsWith("g6e")) return { gpu: "l40s", count: gpusInSize(t) };
  if (fam.startsWith("g6")) return { gpu: "l4", count: gpusInSize(t) };
  if (fam.startsWith("g5")) return { gpu: "a10g", count: gpusInSize(t) };
  return { gpu: "unknown", count: 1 };
}

function estimateEnergyCo2(gpuId: string, gpuHours: number, regionId: string): { kwh: number; co2: number } {
  const w = GPU_WATTS[gpuId];
  const r = regionById(regionId);
  if (!w || !r || gpuHours <= 0) return { kwh: 0, co2: 0 };
  const kwh = (w / 1000) * gpuHours * (r.pue ?? 1.2);
  const co2 = (kwh * (r.carbon ?? 0)) / 1000; // carbon is gCO₂/kWh → kg
  return { kwh, co2 };
}

function configured(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) && process.env.GRIDMIND_AWS !== "off";
}

async function fetchUsage(days: number): Promise<UsageRow[]> {
  if (!configured()) return [];
  const client = new CostExplorerClient({ region: process.env.AWS_REGION || "us-east-1" });
  const teamTag = process.env.GRIDMIND_AWS_TEAM_TAG;
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + 1); // CE End is exclusive
  const groupBy = [
    { Type: "DIMENSION" as const, Key: "INSTANCE_TYPE" },
    teamTag ? { Type: "TAG" as const, Key: teamTag } : { Type: "DIMENSION" as const, Key: "REGION" },
  ];

  const rows: UsageRow[] = [];
  let nextToken: string | undefined;
  do {
    const input: GetCostAndUsageCommandInput = {
      TimePeriod: { Start: rangeStart(days), End: utcDay(end) },
      Granularity: "DAILY",
      Metrics: ["UnblendedCost", "UsageQuantity"],
      // Focus on the compute service where GPUs live; drop $0 noise.
      Filter: { Dimensions: { Key: "SERVICE", Values: ["Amazon Elastic Compute Cloud - Compute"] } },
      GroupBy: groupBy,
      NextPageToken: nextToken,
    };
    const res = await client.send(new GetCostAndUsageCommand(input));
    nextToken = res.NextPageToken;
    for (const period of res.ResultsByTime ?? []) {
      const day = period.TimePeriod?.Start ?? utcDay(new Date());
      for (const g of period.Groups ?? []) {
        const cost = Number(g.Metrics?.UnblendedCost?.Amount ?? 0);
        if (cost <= 0) continue;
        const usageQty = Number(g.Metrics?.UsageQuantity?.Amount ?? 0);
        const instanceType = g.Keys?.[0] ?? "";
        const second = g.Keys?.[1] ?? "";
        const { gpu, count } = instanceToGpu(instanceType);
        const regionId = teamTag ? "unknown" : mapRegion(second, KNOWN);
        const team = teamTag ? (second && second !== `${teamTag}$` ? second.replace(`${teamTag}$`, "") || "untagged" : "untagged") : "untagged";
        const gpuHours = usageQty > 0 ? usageQty * count : 0;
        const { kwh, co2 } = estimateEnergyCo2(gpu, gpuHours, regionId);
        rows.push({
          day, providerId: "aws", regionId, gpuId: gpu, modelId: "unknown",
          team, projectId: "untagged", gpuHours, cost, energyKwh: kwh, co2Kg: co2, utilization: 0, anomaly: 0,
        });
      }
    }
  } while (nextToken);
  return rows;
}

export const awsProvider: CostProvider = {
  id: "aws",
  label: "Amazon Web Services",
  configured,
  status(): ProviderStatus {
    return {
      id: "aws", label: "Amazon Web Services", configured: configured(), mode: "read-only",
      detail: configured() ? `Cost Explorer · ${process.env.AWS_REGION || "us-east-1"}` : "Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (ce:GetCostAndUsage)",
    };
  },
  fetchUsage,
};
