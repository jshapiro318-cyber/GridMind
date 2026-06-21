// ─────────────────────────────────────────────────────────────────────────────
// Real cloud-cost provider integration — the layer that makes the data real.
//
// Each provider adapter reads the customer's OWN read-only credentials (from env,
// never handled by us) and returns normalized usage rows that match the `usage`
// SQLite table 1:1, so every existing dashboard aggregation lights up with real
// numbers. Read-only: nothing here launches, drains, bids, or moves money.
//
// What real billing APIs DO give you: spend (cost) by day, region, and (with
// instance-type / SKU detail) GPU type, plus usage quantity → GPU-hours, plus
// team/project IF you use cost-allocation tags. What they DON'T give you:
// utilization (needs metrics APIs) and energy/carbon (estimated here from the
// region's grid intensity in the catalog). Unknowns are labelled honestly, never
// fabricated.
// ─────────────────────────────────────────────────────────────────────────────

/** One normalized usage record — column-compatible with the `usage` table. */
export interface UsageRow {
  day: string;          // YYYY-MM-DD (UTC)
  providerId: string;   // catalog id: aws | gcp | azure | coreweave | lambda | …
  regionId: string;     // catalog region id (best-effort map) or the raw region
  gpuId: string;        // catalog gpu id (from instance type/SKU) or "unknown"
  modelId: string;      // not derivable from billing → "unknown"
  team: string;         // from a cost-allocation tag, else "untagged"
  projectId: string;    // from a tag / GCP project / sub, else "untagged"
  gpuHours: number;     // usage quantity × GPUs-per-instance where known, else 0
  cost: number;         // REAL unblended spend, USD
  energyKwh: number;    // estimated from gpuHours × board power × region PUE (0 if unknown)
  co2Kg: number;        // estimated from energyKwh × region grid gCO₂/kWh (0 if unknown)
  utilization: number;  // not available from billing → 0
  anomaly: number;      // 0 (spikes can be flagged downstream)
}

export interface ProviderStatus {
  id: string;
  label: string;
  configured: boolean;  // are this provider's credentials present in env?
  mode: "read-only";    // we never request write scopes
  detail: string;       // human note, e.g. "Cost Explorer · us-east-1"
}

export interface CostProvider {
  id: string;
  label: string;
  /** True when the required read-only credentials are present in the environment. */
  configured(): boolean;
  status(): ProviderStatus;
  /** Pull the last `days` of real usage. Returns [] when not configured. */
  fetchUsage(days: number): Promise<UsageRow[]>;
}

// ── Shared helpers (used by every adapter) ──────────────────────────────────

export function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function rangeStart(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return utcDay(d);
}

/** Map a cloud region code to the closest catalog region id (else return raw). */
export function mapRegion(raw: string, known: Set<string>): string {
  if (!raw) return "unknown";
  const r = raw.toLowerCase();
  if (known.has(r)) return r;
  // common aliases → catalog ids
  const alias: Record<string, string> = {
    "us-west-1": "us-west-2", "us-west1": "us-west-2", "us-west-2": "us-west-2",
    "us-east1": "us-east-1", "useast1": "us-east-1",
    "eu-west1": "eu-west-1", "europe-west1": "eu-west-1", "westeurope": "eu-central-1",
    "europe-north1": "eu-north-1", "swedencentral": "eu-north-1",
    "northcentralus": "us-central-tx", "eastus": "us-east-1", "eastus2": "us-east-2",
    "westus2": "us-west-2", "canadacentral": "ca-central", "southcentralus": "us-central-tx",
    "asia-south1": "ap-south-1", "centralindia": "ap-south-1",
    "asia-southeast1": "ap-southeast-1", "southeastasia": "ap-southeast-1",
    "asia-northeast1": "ap-northeast-1", "japaneast": "ap-northeast-1",
    "southamerica-east1": "sa-east-1", "brazilsouth": "sa-east-1",
  };
  return alias[r] ?? (known.has(r) ? r : raw);
}

// Rough board power (W) per catalog GPU — only for the carbon/energy ESTIMATE.
export const GPU_WATTS: Record<string, number> = {
  h200: 700, h100: 700, mi300x: 750, "a100-80": 400, "a100-40": 400, l40s: 350, a10g: 150, l4: 72,
};
