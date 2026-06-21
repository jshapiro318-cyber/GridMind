import Link from "next/link";
import { getForecast, getKpis, getRecommendations, getWaste, getAnomalies } from "@/lib/data";
import { getPreferences } from "@/lib/preferences-actions";
import { signedPct, usd } from "@/lib/format";
import { ForecastChart } from "@/components/ForecastChart";
import { Card, Delta, ProgressBar, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const CAT: Record<string, { label: string; color: string }> = {
  routing: { label: "Routing", color: "#ecb84c" },
  rightsizing: { label: "Right-sizing", color: "#ff9a5c" },
  commitment: { label: "Commitment", color: "#b08cff" },
  carbon: { label: "Carbon", color: "#3fe39a" },
};

export default async function BudgetPage() {
  const prefs = await getPreferences();
  const [fc, waste, recs, k, anomalies] = await Promise.all([
    getForecast(30),
    getWaste(),
    getRecommendations(),
    getKpis(prefs.monthlyBudget),
    getAnomalies(),
  ]);
  const totalRecSavings = recs.reduce((a, b) => a + b.savingsUsd, 0);

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="card-pad">
          <div className="stat-label">Forecast · next 30 days</div>
          <div className="tnum mt-2 text-2xl font-semibold text-ink">{usd(fc.nextMonth)}</div>
          <div className="mt-1.5">
            <Delta value={fc.changePct} goodWhenDown suffix="vs last 30d" />
          </div>
        </Card>
        <Card className="card-pad">
          <div className="stat-label">Daily run rate</div>
          <div className="tnum mt-2 text-2xl font-semibold text-ink">{usd(fc.dailyRunRate)}</div>
          <div className="mt-1 text-xs text-ink-faint">trend-fitted, today</div>
        </Card>
        <Card className="card-pad">
          <div className="stat-label">Reclaimable waste</div>
          <div className="tnum mt-2 text-2xl font-semibold text-amber">{usd(waste.totalReclaim)}</div>
          <div className="mt-1 text-xs text-ink-faint">{waste.idleProjects} under-utilized projects</div>
        </Card>
        <Card className="card-pad">
          <div className="stat-label">Forecast confidence</div>
          <div className="tnum mt-2 text-2xl font-semibold text-ink">{fc.confidence.toFixed(0)}%</div>
          <div className="mt-2">
            <ProgressBar value={fc.confidence} accent="#ff9a5c" />
          </div>
        </Card>
      </div>

      {/* Forecast + alert */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="card-pad xl:col-span-2">
          <SectionTitle
            title="Spend forecast"
            hint="90-day trend model · 95% confidence band · 30-day horizon"
            right={<span className="pill text-electric">ML forecast</span>}
          />
          <ForecastChart points={fc.points} />
        </Card>

        <Card className="card-pad">
          <SectionTitle
            title="Budget alerts"
            right={
              <Link href="/settings" className="pill transition-colors hover:border-brand/40 hover:text-brand">
                {prefs.monthlyBudget > 0 ? `Target ${usd(prefs.monthlyBudget, { compact: true })}` : "Auto budget"}
              </Link>
            }
          />
          <div className={`rounded-lg border p-3 ${k.budgetUsedPct > 100 ? "border-rose/30 bg-rose/5" : "border-leaf/20 bg-leaf/5"}`}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Projected vs budget</span>
              <span className={`tnum font-semibold ${k.budgetUsedPct > 100 ? "text-rose" : "text-leaf"}`}>{signedPct(k.budgetUsedPct - 100)}</span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              {k.budgetUsedPct > 100
                ? `Forecast to exceed budget by ${usd(k.projectedMonth - k.monthBudget)} this month. Applying the top recommendation closes the gap.`
                : `On pace to finish ${usd(k.monthBudget - k.projectedMonth)} under budget.`}
            </p>
          </div>
          <div className="mt-3">
            <div className="stat-label mb-2">Spend anomalies</div>
            <div className="flex flex-col gap-2">
              {anomalies.slice(0, 4).map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-line bg-bg-raised px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-ink">{a.project}</div>
                    <div className="truncate text-[11px] text-ink-faint">{a.team} · {a.day}</div>
                  </div>
                  <span className="tnum shrink-0 text-xs font-semibold text-amber">+{usd(a.cost, { compact: true })}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="card-pad">
        <SectionTitle
          title="Optimization recommendations"
          hint="Ranked by monthly impact"
          right={<span className="pill text-brand">{usd(totalRecSavings)}/mo total</span>}
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {recs.map((r) => {
            const cat = CAT[r.category];
            return (
              <div key={r.id} className="flex items-start gap-3 rounded-xl border border-line bg-bg-raised p-4">
                <div className="mt-0.5 h-9 w-9 shrink-0 rounded-lg border" style={{ borderColor: cat.color + "44", background: cat.color + "12" }}>
                  <div className="flex h-full w-full items-center justify-center text-sm" style={{ color: cat.color }}>
                    {r.category === "routing" ? "⇄" : r.category === "rightsizing" ? "▣" : r.category === "commitment" ? "◆" : "❋"}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-ink">{r.title}</h4>
                    <span className="rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider" style={{ color: cat.color, background: cat.color + "14" }}>
                      {cat.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{r.detail}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="tnum text-sm font-semibold text-brand">Save {usd(r.savingsUsd, { compact: true })}/mo</span>
                    <button className="rounded-md border border-line px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-brand/40 hover:text-brand">
                      Apply →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Waste table */}
      <Card className="card-pad">
        <SectionTitle title="Waste detection" hint={`Projects under 45% GPU utilization · ${usd(waste.idleSpend)} of spend at risk`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-ink-faint">
                <th className="py-2 pr-4 font-medium">Project</th>
                <th className="py-2 pr-4 font-medium">Team</th>
                <th className="py-2 pr-4 font-medium">Spend 30d</th>
                <th className="py-2 pr-4 font-medium">Utilization</th>
                <th className="py-2 text-right font-medium">Reclaimable</th>
              </tr>
            </thead>
            <tbody>
              {waste.rows.map((w) => (
                <tr key={w.id} className="border-b border-line/50">
                  <td className="py-2.5 pr-4 text-ink">{w.project}</td>
                  <td className="py-2.5 pr-4 text-ink-muted">{w.team}</td>
                  <td className="tnum py-2.5 pr-4 text-ink-muted">{usd(w.cost, { compact: true })}</td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line">
                        <div className="h-full rounded-full bg-amber" style={{ width: `${w.util * 100}%` }} />
                      </div>
                      <span className="tnum text-xs text-amber">{Math.round(w.util * 100)}%</span>
                    </div>
                  </td>
                  <td className="tnum py-2.5 text-right font-semibold text-brand">{usd(w.reclaim, { compact: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-ink-faint">Reclaimable estimate assumes right-sizing toward a 60% utilization target via autoscaling.</p>
      </Card>
    </div>
  );
}
