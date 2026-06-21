import "server-only";
import { q, q1 } from "./db";
import { getCurrentOrgId } from "./tenant";
import {
  GPUS,
  PROVIDERS,
  gpuById,
  hourlyRate,
  modelById,
  projectById,
  providerById,
  regionById,
} from "./catalog";
import { regionPriceFactor } from "./routing";
import { usd } from "./format";

function dateMinus(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Newest day with data for an org; falls back to today for an empty org. */
async function maxDay(org: string): Promise<string> {
  const row = await q1<{ d: string | null }>("SELECT MAX(day) AS d FROM usage WHERE org_id = ?", [org]);
  return row?.d ?? todayIso();
}

async function sumCostBetween(org: string, a: string, b: string): Promise<number> {
  const row = await q1<{ s: number }>(
    "SELECT COALESCE(SUM(cost),0) AS s FROM usage WHERE org_id = ? AND day >= ? AND day <= ?",
    [org, a, b]
  );
  return row?.s ?? 0;
}

// Cheapest achievable hourly rate per GPU across every provider/region that
// offers it — the routing engine's theoretical floor. Drives savings math.
const bestHourlyByGpu: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  for (const g of GPUS) {
    let best = Infinity;
    for (const p of PROVIDERS) {
      if (!p.gpuIds.includes(g.id)) continue;
      for (const rId of p.regionIds) {
        const r = regionById(rId);
        if (!r) continue;
        const h = hourlyRate(g.id, p.id) * regionPriceFactor(r.electricityCents);
        if (h < best) best = h;
      }
    }
    if (best < Infinity) out[g.id] = best;
  }
  return out;
})();

export interface Kpis {
  totalSpend90: number;
  last30: number;
  prev30: number;
  spendChangePct: number;
  todaySpend: number;
  yesterdaySpend: number;
  todayChangePct: number;
  mtd: number;
  projectedMonth: number;
  monthBudget: number;
  budgetUsedPct: number;
  energyKwh90: number;
  co2Kg90: number;
  avgUtil: number;
  gpuHours90: number;
  records: number;
}

export interface NamedValue {
  id: string;
  label: string;
  value: number;
  accent?: string;
  meta?: string;
}

export interface TrendPoint {
  day: string;
  cost: number;
  co2: number;
}

export interface SavingsEstimate {
  savingsUsd: number;
  savingsPct: number;
}

export interface Anomaly {
  day: string;
  team: string;
  project: string;
  provider: string;
  cost: number;
}

export interface RegionUsage {
  regionId: string;
  cost: number;
  gpuHours: number;
  co2Kg: number;
  energyKwh: number;
  records: number;
}

export interface DashboardData {
  kpis: Kpis;
  trend: TrendPoint[];
  utilTrend: { day: string; util: number }[];
  byProvider: NamedValue[];
  byModel: NamedValue[];
  byTeam: NamedValue[];
  byProject: NamedValue[];
  savings: SavingsEstimate;
  anomalies: Anomaly[];
  topRegion: { regionId: string; cost: number } | null;
}

export async function getKpis(budgetOverride?: number): Promise<Kpis> {
  const org = await getCurrentOrgId();
  const today = await maxDay(org);
  const last30From = dateMinus(today, 29);
  const prev30From = dateMinus(today, 59);
  const prev30To = dateMinus(today, 30);
  const yesterday = dateMinus(today, 1);
  const firstOfMonth = today.slice(0, 8) + "01";

  const [last30, prev30, todaySpend, yesterdaySpend, mtd, totals] = await Promise.all([
    sumCostBetween(org, last30From, today),
    sumCostBetween(org, prev30From, prev30To),
    sumCostBetween(org, today, today),
    sumCostBetween(org, yesterday, yesterday),
    sumCostBetween(org, firstOfMonth, today),
    q1<{ cost: number; energy: number; co2: number; gh: number; n: number; util: number }>(
      `SELECT COALESCE(SUM(cost),0) AS cost, COALESCE(SUM(energy_kwh),0) AS energy,
              COALESCE(SUM(co2_kg),0) AS co2, COALESCE(SUM(gpu_hours),0) AS gh,
              COUNT(*) AS n,
              CASE WHEN SUM(gpu_hours) > 0 THEN SUM(utilization * gpu_hours)/SUM(gpu_hours) ELSE 0 END AS util
       FROM usage WHERE org_id = ?`,
      [org]
    ),
  ]);
  const t = totals ?? { cost: 0, energy: 0, co2: 0, gh: 0, n: 0, util: 0 };

  const dayOfMonth = Number(today.slice(8, 10));
  const daysInMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getUTCDate();
  const projectedMonth = dayOfMonth > 0 ? (mtd / dayOfMonth) * daysInMonth : mtd;
  const monthBudget =
    budgetOverride && budgetOverride > 0 ? budgetOverride : Math.round((prev30 * 1.1) / 1000) * 1000;

  return {
    totalSpend90: t.cost,
    last30,
    prev30,
    spendChangePct: prev30 > 0 ? ((last30 - prev30) / prev30) * 100 : 0,
    todaySpend,
    yesterdaySpend,
    todayChangePct: yesterdaySpend > 0 ? ((todaySpend - yesterdaySpend) / yesterdaySpend) * 100 : 0,
    mtd,
    projectedMonth,
    monthBudget,
    budgetUsedPct: monthBudget > 0 ? (projectedMonth / monthBudget) * 100 : 0,
    energyKwh90: t.energy,
    co2Kg90: t.co2,
    avgUtil: t.util,
    gpuHours90: t.gh,
    records: t.n,
  };
}

export async function getTrend(days = 60): Promise<TrendPoint[]> {
  const org = await getCurrentOrgId();
  const from = dateMinus(await maxDay(org), days - 1);
  return q<TrendPoint>(
    `SELECT day, SUM(cost) AS cost, SUM(co2_kg) AS co2 FROM usage
     WHERE org_id = ? AND day >= ? GROUP BY day ORDER BY day`,
    [org, from]
  );
}

export async function getUtilTrend(days = 60): Promise<{ day: string; util: number }[]> {
  const org = await getCurrentOrgId();
  const from = dateMinus(await maxDay(org), days - 1);
  return q<{ day: string; util: number }>(
    `SELECT day, SUM(utilization * gpu_hours)/SUM(gpu_hours) AS util FROM usage
     WHERE org_id = ? AND day >= ? GROUP BY day ORDER BY day`,
    [org, from]
  );
}

async function last30Window(org: string): Promise<[string, string]> {
  const today = await maxDay(org);
  return [dateMinus(today, 29), today];
}

async function groupCost(org: string, column: string): Promise<{ key: string; cost: number }[]> {
  const [from, to] = await last30Window(org);
  return q<{ key: string; cost: number }>(
    `SELECT ${column} AS key, SUM(cost) AS cost FROM usage
     WHERE org_id = ? AND day >= ? AND day <= ? GROUP BY ${column} ORDER BY cost DESC`,
    [org, from, to]
  );
}

export async function getByProvider(): Promise<NamedValue[]> {
  const org = await getCurrentOrgId();
  return (await groupCost(org, "provider_id")).map((r) => {
    const p = providerById(r.key);
    return { id: r.key, label: p?.short ?? r.key, value: r.cost, accent: p?.accent, meta: p?.kind };
  });
}

export async function getByModel(): Promise<NamedValue[]> {
  const org = await getCurrentOrgId();
  return (await groupCost(org, "model_id")).map((r) => {
    const m = modelById(r.key);
    return { id: r.key, label: m?.name ?? r.key, value: r.cost, meta: m?.family };
  });
}

export async function getByTeam(): Promise<NamedValue[]> {
  const org = await getCurrentOrgId();
  return (await groupCost(org, "team")).map((r) => ({ id: r.key, label: r.key, value: r.cost }));
}

export async function getByProject(): Promise<NamedValue[]> {
  const org = await getCurrentOrgId();
  return (await groupCost(org, "project_id")).map((r) => {
    const p = projectById(r.key);
    return { id: r.key, label: p?.name ?? r.key, value: r.cost, meta: p?.team };
  });
}

export async function getSavings(): Promise<SavingsEstimate> {
  const org = await getCurrentOrgId();
  const [from, to] = await last30Window(org);
  const rows = await q<{ gpu_id: string; cost: number; gh: number }>(
    `SELECT gpu_id, SUM(cost) AS cost, SUM(gpu_hours) AS gh FROM usage
     WHERE org_id = ? AND day >= ? AND day <= ? GROUP BY gpu_id`,
    [org, from, to]
  );

  let spend = 0;
  let savings = 0;
  for (const r of rows) {
    spend += r.cost;
    const currentHourly = r.gh > 0 ? r.cost / r.gh : 0;
    const floor = bestHourlyByGpu[r.gpu_id];
    if (floor && currentHourly > floor) {
      savings += r.cost * (1 - floor / currentHourly);
    }
  }
  savings *= 0.82; // realistic capture rate — not every workload can move freely
  return { savingsUsd: savings, savingsPct: spend > 0 ? (savings / spend) * 100 : 0 };
}

export async function getAnomalies(): Promise<Anomaly[]> {
  const org = await getCurrentOrgId();
  const rows = await q<{ day: string; team: string; project_id: string; provider_id: string; cost: number }>(
    `SELECT day, team, project_id, provider_id, SUM(cost) AS cost FROM usage
     WHERE org_id = ? AND anomaly = 1 GROUP BY day, team, project_id, provider_id ORDER BY day DESC, cost DESC LIMIT 5`,
    [org]
  );
  return rows.map((r) => ({
    day: r.day,
    team: r.team,
    project: projectById(r.project_id)?.name ?? r.project_id,
    provider: providerById(r.provider_id)?.short ?? r.provider_id,
    cost: r.cost,
  }));
}

export async function getRegionUsage(): Promise<RegionUsage[]> {
  const org = await getCurrentOrgId();
  const [from, to] = await last30Window(org);
  const rows = await q<{ region_id: string; cost: number; gpuHours: number; co2Kg: number; energyKwh: number; records: number }>(
    `SELECT region_id, SUM(cost) AS cost, SUM(gpu_hours) AS gpuHours,
            SUM(co2_kg) AS co2Kg, SUM(energy_kwh) AS energyKwh, COUNT(*) AS records
     FROM usage WHERE org_id = ? AND day >= ? AND day <= ? GROUP BY region_id`,
    [org, from, to]
  );
  return rows.map((r) => ({
    regionId: r.region_id,
    cost: r.cost,
    gpuHours: r.gpuHours,
    co2Kg: r.co2Kg,
    energyKwh: r.energyKwh,
    records: r.records,
  }));
}

export async function getDashboard(budgetOverride?: number): Promise<DashboardData> {
  const [kpis, trend, utilTrend, byProvider, byModel, byTeam, byProject, savings, anomalies, regionUsage] =
    await Promise.all([
      getKpis(budgetOverride),
      getTrend(60),
      getUtilTrend(60),
      getByProvider(),
      getByModel(),
      getByTeam(),
      getByProject(),
      getSavings(),
      getAnomalies(),
      getRegionUsage(),
    ]);
  const top = [...regionUsage].sort((a, b) => b.cost - a.cost)[0];
  return {
    kpis,
    trend,
    utilTrend,
    byProvider,
    byModel: byModel.slice(0, 7),
    byTeam,
    byProject: byProject.slice(0, 7),
    savings,
    anomalies,
    topRegion: top ? { regionId: top.regionId, cost: top.cost } : null,
  };
}

// ── Budget Intelligence ──────────────────────────────────────────────────────

export async function getDailyTotals(days = 90): Promise<{ day: string; cost: number }[]> {
  const org = await getCurrentOrgId();
  const from = dateMinus(await maxDay(org), days - 1);
  return q<{ day: string; cost: number }>(
    `SELECT day, SUM(cost) AS cost FROM usage WHERE org_id = ? AND day >= ? GROUP BY day ORDER BY day`,
    [org, from]
  );
}

export interface ForecastPoint {
  label: string;
  day: string;
  value: number;
  lo: number;
  hi: number;
  forecast: boolean;
}

export interface ForecastResult {
  points: ForecastPoint[];
  thisMonth: number;
  nextMonth: number;
  changePct: number;
  dailyRunRate: number;
  confidence: number;
  horizonDays: number;
}

/** Ordinary-least-squares trend forecast on daily spend, with a 95% band. */
export async function getForecast(horizon = 30): Promise<ForecastResult> {
  const rows = await getDailyTotals(90);
  const n = rows.length;
  if (n === 0) {
    return { points: [], thisMonth: 0, nextMonth: 0, changePct: 0, dailyRunRate: 0, confidence: 60, horizonDays: horizon };
  }
  const xs = rows.map((_, i) => i);
  const ys = rows.map((r) => r.cost);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const b = den === 0 ? 0 : num / den;
  const a = my - b * mx;

  let ssRes = 0;
  for (let i = 0; i < n; i++) ssRes += (ys[i] - (a + b * xs[i])) ** 2;
  const sd = Math.sqrt(ssRes / Math.max(1, n - 2));

  const lastDay = rows[n - 1].day;
  const points: ForecastPoint[] = rows.map((r) => ({ label: shortDateLocal(r.day), day: r.day, value: r.cost, lo: r.cost, hi: r.cost, forecast: false }));

  let nextMonth = 0;
  for (let k = 1; k <= horizon; k++) {
    const x = n - 1 + k;
    const v = Math.max(0, a + b * x);
    const widen = 1.96 * sd * Math.sqrt(1 + k / horizon);
    const day = addDays(lastDay, k);
    points.push({ label: shortDateLocal(day), day, value: v, lo: Math.max(0, v - widen), hi: v + widen, forecast: true });
    nextMonth += v;
  }

  const thisMonth = ys.slice(-30).reduce((s, v) => s + v, 0);
  const aggError = (1.96 * sd * Math.sqrt(horizon)) / Math.max(1, nextMonth);
  const confidence = Math.max(60, Math.min(99, 100 * (1 - aggError)));

  return {
    points,
    thisMonth,
    nextMonth,
    changePct: thisMonth > 0 ? ((nextMonth - thisMonth) / thisMonth) * 100 : 0,
    dailyRunRate: Math.max(0, a + b * (n - 1)),
    confidence,
    horizonDays: horizon,
  };
}

function shortDateLocal(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export interface WasteRow {
  id: string;
  project: string;
  team: string;
  cost: number;
  reclaim: number;
  util: number;
  gpuHours: number;
}

export async function getWaste(): Promise<{ rows: WasteRow[]; totalReclaim: number; idleSpend: number; idleProjects: number }> {
  const org = await getCurrentOrgId();
  const [from, to] = await last30Window(org);
  const raw = await q<{ project_id: string; team: string; cost: number; reclaim: number; util: number; gh: number }>(
    `SELECT project_id, team, SUM(cost) AS cost,
            SUM(cost * (0.6 - utilization) / 0.6) AS reclaim,
            SUM(utilization * gpu_hours) / SUM(gpu_hours) AS util,
            SUM(gpu_hours) AS gh
     FROM usage WHERE org_id = ? AND day >= ? AND day <= ? AND utilization < 0.45
     GROUP BY project_id ORDER BY reclaim DESC`,
    [org, from, to]
  );

  const rows: WasteRow[] = raw.map((r) => ({
    id: r.project_id,
    project: projectById(r.project_id)?.name ?? r.project_id,
    team: r.team,
    cost: r.cost,
    reclaim: Math.max(0, r.reclaim),
    util: r.util,
    gpuHours: r.gh,
  }));
  return {
    rows: rows.slice(0, 6),
    totalReclaim: rows.reduce((s, r) => s + r.reclaim, 0),
    idleSpend: rows.reduce((s, r) => s + r.cost, 0),
    idleProjects: rows.length,
  };
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  savingsUsd: number;
  category: "routing" | "rightsizing" | "commitment" | "carbon";
  impact: "high" | "medium";
}

export async function getRecommendations(): Promise<Recommendation[]> {
  const org = await getCurrentOrgId();
  const [from, to] = await last30Window(org);
  const [providers, waste, inferenceRow] = await Promise.all([
    getByProvider(),
    getWaste(),
    q1<{ c: number }>(
      `SELECT COALESCE(SUM(cost),0) AS c FROM usage WHERE org_id = ? AND day >= ? AND day <= ? AND model_id IN ('bge-m3','whisper-v3','ft-support-13b','sdxl','llama-3.1-8b')`,
      [org, from, to]
    ),
  ]);
  const hyperscaler = providers.filter((p) => p.meta === "hyperscaler").reduce((a, b) => a + b.value, 0);
  const inferenceSpend = inferenceRow?.c ?? 0;

  const recs: Recommendation[] = [
    {
      id: "routing",
      title: "Shift hyperscaler training to neoclouds",
      detail: `${usd(hyperscaler, { compact: true })}/mo runs on AWS, GCP & Azure. CoreWeave, Lambda and Together serve the same H100/A100 silicon 25–35% cheaper.`,
      savingsUsd: hyperscaler * 0.22,
      category: "routing",
      impact: "high",
    },
    {
      id: "rightsizing",
      title: "Reclaim idle & underutilized GPUs",
      detail: `${waste.idleProjects} projects average under 45% utilization. Autoscale-to-zero and right-size instances to recover the slack.`,
      savingsUsd: waste.totalReclaim,
      category: "rightsizing",
      impact: "high",
    },
    {
      id: "commitment",
      title: "Convert steady inference to reserved capacity",
      detail: `${usd(inferenceSpend, { compact: true })}/mo of always-on inference is billed on-demand. A 1-year commitment cuts ~28%.`,
      savingsUsd: inferenceSpend * 0.28,
      category: "commitment",
      impact: "medium",
    },
    {
      id: "carbon",
      title: "Route batch jobs to low-carbon regions",
      detail: `Move latency-tolerant batch work to Stockholm & Montréal (24–31 gCO₂/kWh) to cut emissions ~90% at similar cost.`,
      savingsUsd: hyperscaler * 0.04,
      category: "carbon",
      impact: "medium",
    },
  ];
  return recs.sort((a, b) => b.savingsUsd - a.savingsUsd);
}
