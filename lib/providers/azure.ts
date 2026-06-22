import "server-only";
import { REGIONS } from "@/lib/catalog";
import { mapRegion, rangeStart, utcDay, type CostProvider, type ProviderStatus, type UsageRow } from "./types";

// ── Azure Cost Management adapter — REAL, read-only ──────────────────────────
// Needs (the customer's own) service-principal credentials in the environment:
//   AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_SUBSCRIPTION_ID
// Azure role required: "Cost Management Reader" (read-only).

const KNOWN = new Set(REGIONS.map((r) => r.id));

function configured(): boolean {
  return !!(process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_SUBSCRIPTION_ID);
}

/** Acquire a management token in `tenant` using GridMind's OWN multi-tenant app
 *  creds (env AZURE_CLIENT_ID/AZURE_CLIENT_SECRET). The customer admin-consented
 *  this app into their tenant, so the same app id works across every tenant — only
 *  the login path changes. This is the per-org cross-tenant path. */
async function tokenForTenant(tenant: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: process.env.AZURE_CLIENT_ID!,
    client_secret: process.env.AZURE_CLIENT_SECRET!,
    scope: "https://management.azure.com/.default",
    grant_type: "client_credentials",
  });
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, { method: "POST", body });
  if (!res.ok) throw new Error(`Azure token ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

function isoDay(v: unknown): string {
  // Azure returns UsageDate as an int like 20240115
  const s = String(v);
  return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s.slice(0, 10);
}

/** Run the Cost Management daily-by-location query against `sub` with an already
 *  acquired token, and normalize the result. Shared by the env path and the
 *  per-org cross-tenant path so both produce identical rows. */
async function queryUsage(access: string, sub: string, days: number): Promise<UsageRow[]> {
  const url = `https://management.azure.com/subscriptions/${sub}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "ActualCost",
      timeframe: "Custom",
      timePeriod: { from: rangeStart(days), to: utcDay(new Date()) },
      dataset: {
        granularity: "Daily",
        aggregation: { totalCost: { name: "Cost", function: "Sum" } },
        grouping: [{ type: "Dimension", name: "ResourceLocation" }],
      },
    }),
  });
  if (!res.ok) throw new Error(`Azure cost query ${res.status}`);
  const data = (await res.json()) as { properties?: { columns?: { name: string }[]; rows?: unknown[][] } };
  const cols = (data.properties?.columns ?? []).map((c) => c.name);
  const ci = (name: string) => cols.findIndex((c) => c.toLowerCase() === name.toLowerCase());
  const iCost = ci("Cost"), iDate = ci("UsageDate"), iLoc = ci("ResourceLocation");

  return (data.properties?.rows ?? []).map((row): UsageRow => {
    const cost = Number(row[iCost] ?? 0);
    return {
      day: isoDay(row[iDate]),
      providerId: "azure",
      regionId: mapRegion(String(row[iLoc] ?? "").toLowerCase().replace(/\s/g, ""), KNOWN),
      gpuId: "unknown", modelId: "unknown", team: "untagged", projectId: "untagged",
      gpuHours: 0, cost, energyKwh: 0, co2Kg: 0, utilization: 0, anomaly: 0,
    };
  }).filter((r) => r.cost > 0);
}

/** Pull a customer's spend with GridMind's own multi-tenant app creds, against
 *  THEIR tenant + subscription (the per-org cross-tenant path). */
export async function fetchUsageForConnection(tenantId: string, subscriptionId: string, days: number): Promise<UsageRow[]> {
  const access = await tokenForTenant(tenantId);
  return queryUsage(access, subscriptionId, days);
}

async function fetchUsage(days: number): Promise<UsageRow[]> {
  if (!configured()) return [];
  return fetchUsageForConnection(process.env.AZURE_TENANT_ID!, process.env.AZURE_SUBSCRIPTION_ID!, days);
}

export const azureProvider: CostProvider = {
  id: "azure",
  label: "Microsoft Azure",
  configured,
  status(): ProviderStatus {
    return {
      id: "azure", label: "Microsoft Azure", configured: configured(), mode: "read-only",
      detail: configured() ? "Cost Management · subscription scope" : "Set AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_SUBSCRIPTION_ID (Cost Management Reader)",
    };
  },
  fetchUsage,
};
