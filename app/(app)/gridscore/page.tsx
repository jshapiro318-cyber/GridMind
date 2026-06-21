import Link from "next/link";
import { getGridScoreReport } from "@/lib/routingcenter";
import { getPreferences } from "@/lib/preferences-actions";
import { constraintsFrom } from "@/lib/preferences";
import { scoreColor } from "@/lib/gridscore";
import { GridScoreGauge, ScoreBreakdown, ScoreChip } from "@/components/GridScore";
import { Card, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function GridScorePage() {
  const prefs = await getPreferences();
  const r = await getGridScoreReport(constraintsFrom(prefs));
  const gain = r.optimized.score - r.org.score;
  const maxProviderScore = Math.max(...r.providers.map((p) => p.score), 1);

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
      {/* Org score hero */}
      <Card className="card-pad">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-6">
          <GridScoreGauge score={r.org.score} grade={r.org.grade} size={148} label="Your org" />
          <div className="min-w-[260px] flex-1">
            <div className="stat-label">Your organization&apos;s GridScore™</div>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
              You score <span style={{ color: scoreColor(r.org.score) }}>{r.org.score}</span> — grade {r.org.grade}
            </h2>
            <p className="mt-1.5 max-w-lg text-sm text-ink-muted">
              GridScore rates every compute placement on cost efficiency, carbon, latency and reliability. Routing your workloads
              optimally would lift you to <span className="font-medium text-ink">{r.optimized.score} ({r.optimized.grade})</span> — a{" "}
              <span className="font-medium text-brass">+{gain} point</span> gain.
            </p>
            <Link href="/routing" className="press mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg hover:brightness-110">
              Improve my GridScore →
            </Link>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-bg-raised/60 p-4">
            <GridScoreGauge score={r.org.score} grade={r.org.grade} size={84} label="Now" />
            <span className="text-brass">→</span>
            <GridScoreGauge score={r.optimized.score} grade={r.optimized.grade} size={84} label="Possible" />
          </div>
        </div>
      </Card>

      {/* Breakdown + how to improve */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="card-pad">
          <SectionTitle title="Your score breakdown" hint="Weighted: cost 40% · carbon 25% · reliability 20% · latency 15%" />
          <ScoreBreakdown gs={r.org} />
        </Card>

        <Card className="card-pad">
          <SectionTitle title="How to improve your GridScore" hint={`${r.improvements.length} levers → ${r.optimized.score} (${r.optimized.grade})`} />
          <div className="flex flex-col gap-3">
            {r.improvements.map((imp) => (
              <div key={imp.key} className="rounded-xl border border-line bg-bg-raised p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-ink">
                    <span className="h-2 w-2 rounded-sm" style={{ background: imp.accent }} />
                    {imp.label}
                  </span>
                  <span className="tnum text-xs text-ink-muted">
                    {imp.from} → {imp.to} <span className="font-semibold text-brass">+{imp.gain}</span>
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{imp.action}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Provider leaderboard */}
      <Card className="card-pad">
        <SectionTitle title="Provider GridScore leaderboard" hint="Every provider, scored on their best available placement" right={<span className="pill">8 providers</span>} />
        <div className="flex flex-col">
          {r.providers.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 border-b border-line/50 py-2.5 last:border-0">
              <span className="tnum w-5 shrink-0 text-center text-xs text-ink-faint">{i + 1}</span>
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: p.accent }} />
              <div className="w-32 shrink-0">
                <div className="truncate text-sm font-medium text-ink">{p.short}</div>
                <div className="truncate text-[10px] uppercase tracking-wider text-ink-faint">{p.kind}</div>
              </div>
              <div className="hidden min-w-0 flex-1 sm:block">
                <div className="truncate text-xs text-ink-muted">Best: {p.bestRegion}</div>
                <div className="mt-1 hidden gap-3 text-[10px] text-ink-faint md:flex">
                  <span>cost {p.breakdown.cost}</span>
                  <span>carbon {p.breakdown.carbon}</span>
                  <span>latency {p.breakdown.latency}</span>
                  <span>reliability {p.breakdown.reliability}</span>
                </div>
              </div>
              <div className="ml-auto flex w-28 shrink-0 items-center gap-2 sm:w-40">
                <div className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-line sm:block">
                  <div className="h-full rounded-full" style={{ width: `${(p.score / maxProviderScore) * 100}%`, background: scoreColor(p.score) }} />
                </div>
                <ScoreChip score={p.score} grade={p.grade} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-ink-faint">Scores reflect each provider&apos;s most efficient region. A provider can rank higher by being cheaper, greener, faster, or more reliable than peers.</p>
      </Card>
    </div>
  );
}
