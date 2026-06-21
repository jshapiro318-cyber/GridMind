import type { Client, InArgs } from "@libsql/client";
import { PROJECTS, PROVIDERS, gpuById, hourlyRate, regionById } from "./catalog";
import { regionPriceFactor } from "./routing";

// Deterministic PRNG so the seeded org looks identical on every boot.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick<T>(r: number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = r * total;
  for (let i = 0; i < items.length; i++) {
    acc -= weights[i];
    if (acc <= 0) return items[i];
  }
  return items[items.length - 1];
}

const PROVIDER_W: Record<string, number> = {
  aws: 0.26, azure: 0.16, gcp: 0.15, coreweave: 0.12, lambda: 0.09, together: 0.08, crusoe: 0.07, runpod: 0.07,
};
const REGION_POP: Record<string, number> = {
  "us-east-1": 5, "us-east-2": 3, "us-west-2": 2.5, "us-central-tx": 2, "eu-west-1": 2, "eu-central-1": 1.6,
  "ap-south-1": 1.2, "ap-southeast-1": 1, "ap-northeast-1": 1, "sa-east-1": 0.8, "ca-central": 0.9, "eu-north-1": 0.9, "me-central-1": 0.7,
};
const GPU_W: Record<string, number> = {
  h100: 0.3, "a100-80": 0.22, "a100-40": 0.12, l40s: 0.12, a10g: 0.08, l4: 0.07, h200: 0.07, "mi300x": 0.02,
};
const MODEL_W: Record<string, number> = {
  "llama-3.1-70b": 0.18, "llama-3.1-8b": 0.16, "ft-support-13b": 0.13, "bge-m3": 0.12, "mixtral-8x22b": 0.1,
  "llama-3.1-405b": 0.08, "qwen2.5-72b": 0.07, sdxl: 0.07, "whisper-v3": 0.05, "gpt-oss-120b": 0.04,
};

const DAYS = 90;
const ANOMALY_DAYS = new Set([86, 81, 73]); // recent days with a runaway training run

const INSERT_SQL = `INSERT INTO usage
  (org_id, day, provider_id, region_id, gpu_id, model_id, team, project_id, gpu_hours, cost, energy_kwh, co2_kg, utilization, anomaly)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

export async function latestDayForOrg(c: Client, orgId: string): Promise<string | null> {
  const rs = await c.execute({ sql: "SELECT MAX(day) AS d FROM usage WHERE org_id = ?", args: [orgId] });
  return (rs.rows[0]?.d as string | null) ?? null;
}

/** Build the deterministic sample-fleet rows (column order matches INSERT_SQL after org_id). */
function buildRows(): InArgs[] {
  const rnd = mulberry32(0x6d1f3a7b);
  const providerIds = Object.keys(PROVIDER_W);
  const providerW = providerIds.map((p) => PROVIDER_W[p]);
  const gpuIds = Object.keys(GPU_W);
  const gpuW = gpuIds.map((g) => GPU_W[g]);
  const modelIds = Object.keys(MODEL_W);
  const modelW = modelIds.map((m) => MODEL_W[m]);
  const projectW = PROJECTS.map((p) => (p.team === "Research" ? 1.4 : p.team === "Platform" ? 1.2 : 1));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const rows: InArgs[] = [];
  for (let d = 0; d < DAYS; d++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (DAYS - 1 - d));
    const iso = date.toISOString().slice(0, 10);
    const dow = date.getUTCDay();
    const weekend = dow === 0 || dow === 6 ? 0.62 : 1;
    const trend = 1 + (d / DAYS) * 0.42; // ~42% growth across the window
    const noise = 0.85 + rnd() * 0.3;
    const records = Math.round(46 * weekend * trend * noise);

    for (let i = 0; i < records; i++) {
      const providerId = weightedPick(rnd(), providerIds, providerW);
      const provider = PROVIDERS.find((p) => p.id === providerId)!;

      let gpuId = weightedPick(rnd(), gpuIds, gpuW);
      if (!provider.gpuIds.includes(gpuId)) gpuId = provider.gpuIds[Math.floor(rnd() * provider.gpuIds.length)];

      const regs = provider.regionIds;
      const regId = weightedPick(rnd(), regs, regs.map((r) => REGION_POP[r] ?? 1));
      const region = regionById(regId)!;

      const modelId = weightedPick(rnd(), modelIds, modelW);
      const project = weightedPick(rnd(), PROJECTS, projectW);

      const cls = rnd();
      let gpuHours: number;
      if (cls < 0.7) gpuHours = 8 + rnd() * 52;
      else if (cls < 0.92) gpuHours = 60 + rnd() * 240;
      else gpuHours = 300 + rnd() * 1200;

      let anomaly = 0;
      if (ANOMALY_DAYS.has(d) && rnd() < 0.04) {
        gpuHours = 1500 + rnd() * 2600;
        anomaly = 1;
      }

      const hourly = hourlyRate(gpuId, providerId) * regionPriceFactor(region.electricityCents);
      const cost = gpuHours * hourly;
      const gpu = gpuById(gpuId)!;
      const energy = (gpu.tdpW / 1000) * gpuHours * region.pue;
      const co2 = (energy * region.carbon) / 1000;
      const util = rnd() < 0.18 ? 0.16 + rnd() * 0.22 : 0.55 + rnd() * 0.4;

      rows.push([
        iso, providerId, regId, gpuId, modelId, project.team, project.id,
        Math.round(gpuHours * 10) / 10,
        Math.round(cost * 100) / 100,
        Math.round(energy * 10) / 10,
        Math.round(co2 * 10) / 10,
        Math.round(Math.min(0.99, util) * 1000) / 1000,
        anomaly,
      ]);
    }
  }
  return rows;
}

/** Replace an org's usage with the deterministic sample fleet. */
export async function seedOrg(c: Client, orgId: string): Promise<void> {
  const rows = buildRows();
  await c.execute({ sql: "DELETE FROM usage WHERE org_id = ?", args: [orgId] });
  const stmts = rows.map((r) => ({ sql: INSERT_SQL, args: [orgId, ...(r as unknown[])] as InArgs }));
  // Chunk so a single batch never gets pathologically large (esp. over the wire).
  for (let i = 0; i < stmts.length; i += 500) {
    await c.batch(stmts.slice(i, i + 500), "write");
  }
}
