import "server-only";
import { GPUS, REGIONS, regionById } from "./catalog";
import { GPU_WATTS, mapRegion, type UsageRow } from "./providers/types";

// ─────────────────────────────────────────────────────────────────────────────
// CSV import — let a user drop a billing/usage export and see their own numbers.
//
// Forgiving by design: the only required columns are a date and a cost; provider,
// region, GPU, hours, team/project, utilization are used when present. Region and
// GPU are mapped to catalog ids where possible; energy/carbon are ESTIMATED only
// when GPU + hours are known, else left at 0 (never fabricated).
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_REGIONS = new Set(REGIONS.map((r) => r.id));
const KNOWN_GPUS = new Set(GPUS.map((g) => g.id));

const ALIASES: Record<string, keyof Mapped> = {
  date: "day", day: "day", usage_date: "day", ds: "day", billing_day: "day", invoice_date: "day",
  cost: "cost", amount: "cost", spend: "cost", unblended_cost: "cost", cost_usd: "cost", usd: "cost", total: "cost",
  provider: "provider", cloud: "provider", provider_id: "provider", vendor: "provider", service: "provider",
  region: "region", region_id: "region", location: "region", az: "region", availability_zone: "region",
  gpu: "gpu", gpu_id: "gpu", instance_type: "gpu", accelerator: "gpu", gpu_type: "gpu",
  gpu_hours: "gpuHours", hours: "gpuHours", "gpu-hours": "gpuHours", quantity: "gpuHours", usage_quantity: "gpuHours",
  model: "model", model_id: "model",
  team: "team", cost_center: "team", owner: "team",
  project: "project", project_id: "project", project_name: "project", application: "project",
  utilization: "utilization", util: "utilization", gpu_util: "utilization", utilisation: "utilization",
};

interface Mapped {
  day: string; cost: string; provider: string; region: string; gpu: string;
  gpuHours: string; model: string; team: string; project: string; utilization: string;
}

export interface CsvParseResult {
  rows: UsageRow[];
  total: number;
  skipped: number;
  error?: string;
}

/** Split CSV text into rows of cells, honoring quoted fields and escaped quotes. */
function parseCells(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { cur.push(field); field = ""; }
    else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function normDay(raw: string): string | null {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function num(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number(raw.replace(/[$,\s]/g, ""));
  return isFinite(n) ? n : 0;
}

export function parseCsvUsage(text: string): CsvParseResult {
  const cells = parseCells(text);
  if (cells.length < 2) return { rows: [], total: 0, skipped: 0, error: "CSV needs a header row and at least one data row." };

  const header = cells[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const colOf: Partial<Record<keyof Mapped, number>> = {};
  header.forEach((h, i) => {
    const key = ALIASES[h];
    if (key && colOf[key] === undefined) colOf[key] = i;
  });

  if (colOf.day === undefined || colOf.cost === undefined) {
    return { rows: [], total: 0, skipped: 0, error: "Couldn't find a date column and a cost column. Include headers like `date` and `cost`." };
  }

  const rows: UsageRow[] = [];
  let skipped = 0;
  const get = (cells: string[], key: keyof Mapped): string | undefined => {
    const i = colOf[key];
    return i === undefined ? undefined : cells[i];
  };

  for (let r = 1; r < cells.length; r++) {
    const row = cells[r];
    const day = normDay(get(row, "day") ?? "");
    const cost = num(get(row, "cost"));
    if (!day) { skipped++; continue; }

    const regionRaw = (get(row, "region") ?? "").trim();
    const regionId = regionRaw ? mapRegion(regionRaw, KNOWN_REGIONS) : "unknown";
    const gpuRaw = (get(row, "gpu") ?? "").trim().toLowerCase();
    const gpuId = KNOWN_GPUS.has(gpuRaw) ? gpuRaw : "unknown";
    const gpuHours = num(get(row, "gpuHours"));

    let utilization = num(get(row, "utilization"));
    if (utilization > 1) utilization = utilization / 100; // tolerate "73" meaning 73%

    // Estimate energy/carbon only when we actually know the GPU + hours.
    let energyKwh = 0;
    let co2Kg = 0;
    if (gpuId !== "unknown" && gpuHours > 0) {
      const reg = regionById(regionId);
      const watts = GPU_WATTS[gpuId] ?? 0;
      energyKwh = (watts / 1000) * gpuHours * (reg?.pue ?? 1.2);
      co2Kg = (energyKwh * (reg?.carbon ?? 400)) / 1000;
    }

    rows.push({
      day,
      providerId: (get(row, "provider") ?? "unknown").trim().toLowerCase() || "unknown",
      regionId,
      gpuId,
      modelId: (get(row, "model") ?? "unknown").trim() || "unknown",
      team: (get(row, "team") ?? "untagged").trim() || "untagged",
      projectId: (get(row, "project") ?? "untagged").trim() || "untagged",
      gpuHours: Math.round(gpuHours * 10) / 10,
      cost: Math.round(cost * 100) / 100,
      energyKwh: Math.round(energyKwh * 10) / 10,
      co2Kg: Math.round(co2Kg * 10) / 10,
      utilization: Math.max(0, Math.min(1, utilization)),
      anomaly: 0,
    });
  }

  return { rows, total: cells.length - 1, skipped };
}
