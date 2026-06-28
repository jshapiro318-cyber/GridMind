import "server-only";
import { q, q1 } from "./db";
import { getCurrentOrgId } from "./tenant";
import { projectById, providerById } from "./catalog";
import { getGridScoreSummary } from "./routingcenter";
import { getByModel, getByProject, getByTeam, getDailyTotals, getForecast, getKpis, getSavings, getWaste } from "./data";
import { usd } from "./format";
import type { RouteConstraints } from "./routing";

// ─────────────────────────────────────────────────────────────────────────────
// Executive Command Center — Level 1 of the information hierarchy.
//
// Composes the existing aggregations into the six headline metrics a founder
// reads first, the cost-driver leaderboard, and the spend timeline series. All
// values are computed from the org's usage table — illustrative on the demo
// org, real on a connected org.
// ─────────────────────────────────────────────────────────────────────────────

function dateMinus(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function maxDay(org: string): Promise<string> {
  const row = await q1<{ d: string | null }>("SELECT MAX(day) AS d FROM usage WHERE org_id = ?", [org]);
  return row?.d ?? new Date().toISOString().slice(0, 10);
}

export type HealthTone = "good" | "warn" | "bad";

export interface ExecMetric {
  id: string;
  label: string;
  value: string;
  sub: string;
  /** Optional signed % delta for a trend chip. */
  deltaPct?: number;
  goodWhenDown?: boolean;
  tone?: HealthTone;
  accent?: string;
}

/** The six headline metrics for the executive overview. */
export async function getExecutiveMetrics(constraints?: RouteConstraints): Promise<ExecMetric[]> {
  const [k, gs, sav, fc, waste] = await Promise.all([
    getKpis(),
    getGridScoreSummary(constraints),
    getSavings(),
    getForecast(30),
    getWaste(),
  ]);

  const annualSavings = gs.savings * 12;
  const runwayMonths = k.last30 > 0 ? annualSavings / k.last30 : 0;

  const idleShare = k.last30 > 0 ? Math.min(1, waste.idleSpend / k.last30) : 0;
  const health = Math.round(Math.max(0, Math.min(100, k.avgUtil * 100 * 1.05 - idleShare * 35 - waste.idleProjects * 1.5)));
  const healthTone: HealthTone = health >= 80 ? "good" : health >= 62 ? "warn" : "bad";

  const costEff = Math.max(0, 1 - sav.savingsPct / 100);
  const efficiency = Math.round(Math.max(0, Math.min(100, (k.avgUtil * 0.6 + costEff * 0.4) * 100)));
  const effTone: HealthTone = efficiency >= 78 ? "good" : efficiency >= 60 ? "warn" : "bad";

  return [
    {
      id: "spend",
      label: "Monthly AI spend",
      value: usd(k.last30),
      sub: `${usd(fc.nextMonth)} forecast next 30d`,
      deltaPct: k.spendChangePct,
      goodWhenDown: true,
    },
    {
      id: "savings",
      label: "Potential savings",
      value: usd(gs.savings),
      sub: `${usd(annualSavings)}/yr · ${gs.savingsPct.toFixed(0)}% of spend`,
      accent: "#ffd97a",
    },
    {
      id: "optscore",
      label: "Optimization score",
      value: `${gs.current.score}`,
      sub: `Grade ${gs.current.grade} · +${gs.optimized.score - gs.current.score} available`,
      accent: "#ecb84c",
    },
    {
      id: "runway",
      label: "Runway extension",
      value: `+${runwayMonths.toFixed(1)} mo`,
      sub: "added per year if savings captured",
      accent: "#b08cff",
    },
    {
      id: "health",
      label: "Infrastructure health",
      value: `${health}`,
      sub: healthTone === "good" ? "All systems optimal" : `${waste.idleProjects} under-utilized projects`,
      tone: healthTone,
    },
    {
      id: "efficiency",
      label: "AI efficiency score",
      value: `${efficiency}`,
      sub: `${Math.round(k.avgUtil * 100)}% avg GPU utilization`,
      tone: effTone,
    },
  ];
}

export interface CostDriver {
  id: string;
  kind: "increase" | "decrease" | "expensive" | "efficient";
  label: string;
  name: string;
  meta: string;
  value: string;
  deltaPct?: number;
}

interface DimRow {
  key: string;
  cur: number;
  prev: number;
}

// SQL identifiers (column names) cannot be bound as query parameters, so the
// grouping column is validated against a fixed allowlist before it is ever
// interpolated. Every value (org, dates) stays parameterized with `?`. This
// closes the SQL-injection vector on `column`.
const GROUP_COLUMNS = new Set(["provider_id", "region_id", "gpu_id", "model_id", "team", "project_id"]);

async function deltaByDimension(org: string, column: string): Promise<DimRow[]> {
  if (!GROUP_COLUMNS.has(column)) throw new Error(`deltaByDimension: invalid grouping column "${column}"`);
  const today = await maxDay(org);
  const l30 = dateMinus(today, 29);
  const p30from = dateMinus(today, 59);
  const p30to = dateMinus(today, 30);
  const [cur, prev] = await Promise.all([
    q<{ k: string; c: number }>(`SELECT ${column} AS k, SUM(cost) AS c FROM usage WHERE org_id=? AND day>=? AND day<=? GROUP BY ${column}`, [org, l30, today]),
    q<{ k: string; c: number }>(`SELECT ${column} AS k, SUM(cost) AS c FROM usage WHERE org_id=? AND day>=? AND day<=? GROUP BY ${column}`, [org, p30from, p30to]),
  ]);
  const prevMap = new Map(prev.map((r) => [r.k, r.c]));
  return cur.map((r) => ({ key: r.k, cur: r.c, prev: prevMap.get(r.k) ?? 0 }));
}

/** Top Cost Drivers leaderboard for the command center. */
export async function getCostDrivers(): Promise<CostDriver[]> {
  const org = await getCurrentOrgId();
  const today = await maxDay(org);
  const l30 = dateMinus(today, 29);
  const [byProjectRaw, teams, projects, models, eff] = await Promise.all([
    deltaByDimension(org, "project_id"),
    getByTeam(),
    getByProject(),
    getByModel(),
    q<{ k: string; e: number }>(
      `SELECT team AS k, SUM(utilization*gpu_hours)/SUM(gpu_hours) AS e FROM usage WHERE org_id=? AND day>=? AND day<=? GROUP BY team ORDER BY e DESC`,
      [org, l30, today]
    ),
  ]);

  const byProject = byProjectRaw
    .map((r) => ({ ...r, delta: r.cur - r.prev, pct: r.prev > 0 ? ((r.cur - r.prev) / r.prev) * 100 : 100 }))
    .filter((r) => r.prev > 0 || r.cur > 0);
  const up = [...byProject].sort((a, b) => b.delta - a.delta)[0];
  const down = [...byProject].sort((a, b) => a.delta - b.delta)[0];

  const drivers: CostDriver[] = [];
  if (up) {
    const p = projectById(up.key);
    drivers.push({ id: "up", kind: "increase", label: "Largest spending increase", name: p?.name ?? up.key, meta: p?.team ?? "", value: `+${usd(up.delta, { compact: true })}`, deltaPct: up.pct });
  }
  if (down && down.delta < 0) {
    const p = projectById(down.key);
    drivers.push({ id: "down", kind: "decrease", label: "Largest spending decrease", name: p?.name ?? down.key, meta: p?.team ?? "", value: `${usd(down.delta, { compact: true })}`, deltaPct: down.pct });
  }
  if (teams[0]) drivers.push({ id: "team", kind: "expensive", label: "Most expensive team", name: teams[0].label, meta: "30-day spend", value: usd(teams[0].value, { compact: true }) });
  if (projects[0]) drivers.push({ id: "product", kind: "expensive", label: "Most expensive product", name: projects[0].label, meta: projects[0].meta ?? "", value: usd(projects[0].value, { compact: true }) });
  if (models[0]) drivers.push({ id: "model", kind: "expensive", label: "Most expensive model", name: models[0].label, meta: models[0].meta ?? "", value: usd(models[0].value, { compact: true }) });
  if (eff[0]) drivers.push({ id: "eff", kind: "efficient", label: "Most efficient team", name: eff[0].k, meta: "utilization-weighted", value: `${Math.round(eff[0].e * 100)}%` });

  return drivers;
}

export interface SpendSeries {
  daily: { day: string; cost: number }[];
  forecast: { day: string; value: number; lo: number; hi: number }[];
}

/** Daily spend (90d) plus the 30-day forecast — bucketed client-side by the timeline. */
export async function getSpendSeries(): Promise<SpendSeries> {
  const [daily, fc] = await Promise.all([getDailyTotals(90), getForecast(30)]);
  return {
    daily,
    forecast: fc.points.filter((p) => p.forecast).map((p) => ({ day: p.day, value: p.value, lo: p.lo, hi: p.hi })),
  };
}

export interface ProviderBreakdownRow {
  id: string;
  label: string;
  kind: string;
  accent: string;
  cost: number;
  sharePct: number;
}

/** Provider breakdown for the command center, last 30 days. */
export async function getProviderBreakdown(): Promise<ProviderBreakdownRow[]> {
  const org = await getCurrentOrgId();
  const today = await maxDay(org);
  const l30 = dateMinus(today, 29);
  const rows = await q<{ id: string; cost: number }>(
    `SELECT provider_id AS id, SUM(cost) AS cost FROM usage WHERE org_id=? AND day>=? AND day<=? GROUP BY provider_id ORDER BY cost DESC`,
    [org, l30, today]
  );
  const total = rows.reduce((s, r) => s + r.cost, 0) || 1;
  return rows.map((r) => {
    const p = providerById(r.id);
    return {
      id: r.id,
      label: p?.name ?? r.id,
      kind: p?.kind ?? "",
      accent: p?.accent ?? "#ecb84c",
      cost: r.cost,
      sharePct: (r.cost / total) * 100,
    };
  });
}
