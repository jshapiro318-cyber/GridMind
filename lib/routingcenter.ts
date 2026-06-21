import "server-only";
import { q, q1 } from "./db";
import { getCurrentOrgId } from "./tenant";
import { PROVIDERS, gpuById, providerById, regionById } from "./catalog";
import { type Mode, type RouteConstraints, bestRoute } from "./routing";
import { SCORE_AXES, type GridScore, type GridScoreBreakdown, blendScores, scorePlacement, scoreProvider } from "./gridscore";

function dateMinus(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function window30(org: string): Promise<[string, string]> {
  const row = await q1<{ d: string | null }>("SELECT MAX(day) AS d FROM usage WHERE org_id = ?", [org]);
  const today = row?.d ?? new Date().toISOString().slice(0, 10);
  return [dateMinus(today, 29), today];
}

export interface AllocItem {
  key: string;
  providerId: string;
  providerShort: string;
  accent: string;
  regionId: string;
  regionCity: string;
  regionName: string;
  sharePct: number;
  cost: number;
  gridScore: number;
}

export interface Allocation {
  items: AllocItem[];
  totalCost: number;
  gridScore: GridScore;
  carbonKg: number;
  gpuHours: number;
}

function toItems(groups: { providerId: string; regionId: string; cost: number }[], total: number): AllocItem[] {
  const sorted = [...groups].sort((a, b) => b.cost - a.cost);
  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const items: AllocItem[] = top.map((g) => {
    const p = providerById(g.providerId);
    const r = regionById(g.regionId);
    return {
      key: `${g.providerId}|${g.regionId}`,
      providerId: g.providerId,
      providerShort: p?.short ?? g.providerId,
      accent: p?.accent ?? "#ecb84c",
      regionId: g.regionId,
      regionCity: r?.city ?? g.regionId,
      regionName: r?.name ?? g.regionId,
      sharePct: total > 0 ? (g.cost / total) * 100 : 0,
      cost: g.cost,
      gridScore: scorePlacement(g.providerId, g.regionId).score,
    };
  });
  if (rest.length) {
    const restCost = rest.reduce((s, g) => s + g.cost, 0);
    items.push({
      key: "other",
      providerId: "other",
      providerShort: "Other",
      accent: "#6b5a45",
      regionId: "",
      regionCity: `${rest.length} placements`,
      regionName: "Other placements",
      sharePct: total > 0 ? (restCost / total) * 100 : 0,
      cost: restCost,
      gridScore: rest.length ? Math.round(rest.reduce((s, g) => s + scorePlacement(g.providerId, g.regionId).score, 0) / rest.length) : 0,
    });
  }
  return items;
}

/** The org's current workload allocation, derived from the last 30 days. */
export async function getCurrentAllocation(): Promise<Allocation> {
  const org = await getCurrentOrgId();
  const [from, to] = await window30(org);
  const rows = await q<{ providerId: string; regionId: string; cost: number; gh: number; co2: number }>(
    `SELECT provider_id AS providerId, region_id AS regionId, SUM(cost) AS cost,
            SUM(gpu_hours) AS gh, SUM(co2_kg) AS co2
     FROM usage WHERE org_id = ? AND day >= ? AND day <= ? GROUP BY provider_id, region_id`,
    [org, from, to]
  );

  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  return {
    items: toItems(rows, totalCost),
    totalCost,
    gridScore: blendScores(rows.map((r) => ({ weight: r.cost, score: scorePlacement(r.providerId, r.regionId) }))),
    carbonKg: rows.reduce((s, r) => s + r.co2, 0),
    gpuHours: rows.reduce((s, r) => s + r.gh, 0),
  };
}

/** GridMind's recommended allocation: route each GPU type to its best allowed placement. */
export async function getRecommendedAllocation(mode: Mode, constraints?: RouteConstraints): Promise<Allocation> {
  const org = await getCurrentOrgId();
  const [from, to] = await window30(org);
  const gpuRows = await q<{ gpuId: string; gh: number }>(
    `SELECT gpu_id AS gpuId, SUM(gpu_hours) AS gh FROM usage WHERE org_id = ? AND day >= ? AND day <= ? GROUP BY gpu_id`,
    [org, from, to]
  );

  const agg = new Map<string, { providerId: string; regionId: string; cost: number; gh: number }>();
  let carbonKg = 0;
  let gpuHours = 0;

  for (const g of gpuRows) {
    const route = bestRoute({ gpuId: g.gpuId, gpuCount: 1, hours: Math.max(1, g.gh), mode }, constraints);
    if (!route) continue;
    const best = route.best;
    const cost = best.hourly * g.gh;
    gpuHours += g.gh;

    const gpu = gpuById(g.gpuId);
    const r = regionById(best.regionId);
    if (gpu && r) carbonKg += ((gpu.tdpW / 1000) * g.gh * r.pue * r.carbon) / 1000;

    const key = `${best.providerId}|${best.regionId}`;
    const cur = agg.get(key) ?? { providerId: best.providerId, regionId: best.regionId, cost: 0, gh: 0 };
    cur.cost += cost;
    cur.gh += g.gh;
    agg.set(key, cur);
  }

  const groups = [...agg.values()];
  const totalCost = groups.reduce((s, g) => s + g.cost, 0);
  return {
    items: toItems(groups, totalCost),
    totalCost,
    gridScore: blendScores(groups.map((g) => ({ weight: g.cost, score: scorePlacement(g.providerId, g.regionId) }))),
    carbonKg,
    gpuHours,
  };
}

export interface GridScoreSummary {
  current: GridScore;
  optimized: GridScore;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPct: number;
}

/** Lightweight summary for the dashboard hero metric. */
export async function getGridScoreSummary(constraints?: RouteConstraints): Promise<GridScoreSummary> {
  const [cur, rec] = await Promise.all([getCurrentAllocation(), getRecommendedAllocation("balanced", constraints)]);
  const savings = cur.totalCost - rec.totalCost;
  return {
    current: cur.gridScore,
    optimized: rec.gridScore,
    currentCost: cur.totalCost,
    optimizedCost: rec.totalCost,
    savings,
    savingsPct: cur.totalCost > 0 ? (savings / cur.totalCost) * 100 : 0,
  };
}

// ── GridScore report: provider leaderboard + how-to-improve ──────────────────

export interface ProviderScore {
  id: string;
  name: string;
  short: string;
  accent: string;
  kind: string;
  score: number;
  grade: string;
  breakdown: GridScoreBreakdown;
  bestRegion: string;
}

export interface Improvement {
  key: keyof GridScoreBreakdown;
  label: string;
  accent: string;
  from: number;
  to: number;
  gain: number;
  action: string;
}

export interface GridScoreReport {
  org: GridScore;
  optimized: GridScore;
  providers: ProviderScore[];
  improvements: Improvement[];
}

const IMPROVE_ACTIONS: Record<string, string> = {
  cost: "Shift hyperscaler training to neoclouds (CoreWeave, Lambda, Together) at 25–35% lower rates.",
  carbon: "Move latency-tolerant workloads to low-carbon grids — Stockholm, Montréal, Oregon.",
  latency: "Keep latency-sensitive inference in-region, close to your users.",
  reliability: "Diversify across providers and lock reserved capacity for steady-state workloads.",
};

export async function getGridScoreReport(constraints?: RouteConstraints): Promise<GridScoreReport> {
  const [cur, rec] = await Promise.all([getCurrentAllocation(), getRecommendedAllocation("balanced", constraints)]);

  const providers: ProviderScore[] = PROVIDERS.map((p) => {
    const gs = scoreProvider(p.id);
    const best = p.regionIds
      .map((rid) => ({ rid, s: scorePlacement(p.id, rid).score }))
      .sort((a, b) => b.s - a.s)[0];
    return {
      id: p.id,
      name: p.name,
      short: p.short,
      accent: p.accent,
      kind: p.kind,
      score: gs.score,
      grade: gs.grade,
      breakdown: gs.breakdown,
      bestRegion: regionById(best.rid)?.name ?? "",
    };
  }).sort((a, b) => b.score - a.score);

  const improvements: Improvement[] = SCORE_AXES.map((a) => {
    const from = cur.gridScore.breakdown[a.key];
    const to = rec.gridScore.breakdown[a.key];
    return { key: a.key, label: a.label, accent: a.accent, from, to, gain: Math.max(0, to - from), action: IMPROVE_ACTIONS[a.key] };
  })
    .filter((i) => i.gain > 0)
    .sort((a, b) => b.gain - a.gain);

  return { org: cur.gridScore, optimized: rec.gridScore, providers, improvements };
}
