import "server-only";
import { getByModel, getForecast, getKpis, getRecommendations, getWaste } from "./data";
import { getGridScoreSummary } from "./routingcenter";
import { getCostDrivers } from "./overview";
import { signedPct, usd } from "./format";

// ─────────────────────────────────────────────────────────────────────────────
// AI CFO — a permanent assistant that answers the questions a founder actually
// asks, computed from the live data layer (not a canned script). Today the
// reasoning is deterministic; the same briefing object is what a future LLM
// integration would ground its answers in.
// ─────────────────────────────────────────────────────────────────────────────

export type CFOTone = "good" | "warn" | "bad" | "neutral";

export interface CFOAnswer {
  id: string;
  question: string;
  headline: string;
  tone: CFOTone;
  answer: string;
  points: string[];
}

export async function getCFOBriefing(): Promise<{ greeting: string; answers: CFOAnswer[] }> {
  const [k, gs, fc, waste, recs, drivers, models] = await Promise.all([
    getKpis(),
    getGridScoreSummary(),
    getForecast(30),
    getWaste(),
    getRecommendations(),
    getCostDrivers(),
    getByModel(),
  ]);

  const up = drivers.find((d) => d.kind === "increase");
  const topRec = recs[0];

  // Which team wastes the most — aggregate reclaimable spend across idle projects.
  const teamWaste = new Map<string, { reclaim: number; projects: number }>();
  for (const r of waste.rows) {
    const t = teamWaste.get(r.team) ?? { reclaim: 0, projects: 0 };
    t.reclaim += r.reclaim;
    t.projects += 1;
    teamWaste.set(r.team, t);
  }
  const worstTeam = [...teamWaste.entries()].sort((a, b) => b[1].reclaim - a[1].reclaim)[0];

  const topModel = models[0];
  const quarter = fc.nextMonth * 3;
  const thisQuarter = k.last30 * 3;
  const quarterChange = thisQuarter > 0 ? ((quarter - thisQuarter) / thisQuarter) * 100 : 0;

  const answers: CFOAnswer[] = [
    {
      id: "why-change",
      question: "Why did spending change?",
      headline: signedPct(k.spendChangePct),
      tone: k.spendChangePct > 0 ? "warn" : "good",
      answer:
        k.spendChangePct >= 0
          ? `Spend rose ${k.spendChangePct.toFixed(1)}% versus the prior 30 days${up ? `, led by ${up.name} (${up.value})` : ""}.`
          : `Spend fell ${Math.abs(k.spendChangePct).toFixed(1)}% versus the prior 30 days — momentum is in your favor.`,
      points: [
        `Last 30 days: ${usd(k.last30)} · prior: ${usd(k.prev30)}`,
        up ? `Biggest driver: ${up.name} ${up.value} (${up.meta})` : `No single project dominated the change`,
        `Forecast next 30 days: ${usd(fc.nextMonth)}`,
      ],
    },
    {
      id: "team-waste",
      question: "Which team wastes the most money?",
      headline: worstTeam ? `${worstTeam[0]}` : "—",
      tone: "warn",
      answer: worstTeam
        ? `${worstTeam[0]} has the most reclaimable spend — ${usd(worstTeam[1].reclaim)}/mo across ${worstTeam[1].projects} under-utilized project${worstTeam[1].projects > 1 ? "s" : ""}.`
        : `Utilization is healthy across every team right now.`,
      points: [
        `Total reclaimable waste: ${usd(waste.totalReclaim)}/mo`,
        `${waste.idleProjects} projects run under 45% GPU utilization`,
        `Fix: autoscale-to-zero and right-size toward a 60% target`,
      ],
    },
    {
      id: "replace-models",
      question: "What models should we replace?",
      headline: topModel ? topModel.label : "—",
      tone: "neutral",
      answer: topModel
        ? `${topModel.label} is your largest model spend at ${usd(topModel.value)}/mo. Re-routing its GPU hours to neoclouds and right-sizing the serving GPU is the fastest lever.`
        : `No outsized model spend detected.`,
      points: [
        `Top models by spend: ${models.slice(0, 3).map((m) => m.label).join(", ")}`,
        `Routing optimization lifts GridScore ${gs.current.score} → ${gs.optimized.score}`,
        `Estimated routing savings: ${usd(gs.savings)}/mo`,
      ],
    },
    {
      id: "save-more",
      question: "How can we save more?",
      headline: topRec ? `${usd(topRec.savingsUsd)}/mo` : "—",
      tone: "good",
      answer: topRec ? topRec.detail : `You're already near the routing floor — nice work.`,
      points: recs.slice(0, 3).map((r) => `${r.title}: ${usd(r.savingsUsd, { compact: true })}/mo`),
    },
    {
      id: "forecast-quarter",
      question: "Predict next quarter's spending.",
      headline: usd(quarter),
      tone: quarterChange > 8 ? "warn" : "neutral",
      answer: `At the current trend, next quarter runs about ${usd(quarter)} — ${signedPct(quarterChange)} versus this quarter (${usd(thisQuarter)}).`,
      points: [
        `Daily run-rate: ${usd(fc.dailyRunRate)} and ${fc.changePct >= 0 ? "rising" : "falling"}`,
        `Forecast confidence: ${fc.confidence.toFixed(0)}%`,
        `Capturing routing savings would offset ${usd(gs.savings * 3)} of it`,
      ],
    },
  ];

  return {
    greeting: `You're spending ${usd(k.last30)}/mo with ${usd(gs.savings)}/mo of savings on the table. Ask me anything.`,
    answers,
  };
}
