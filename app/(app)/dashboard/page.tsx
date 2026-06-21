import Link from "next/link";
import { getByModel, getByTeam } from "@/lib/data";
import { getGridScoreSummary } from "@/lib/routingcenter";
import { getCostDrivers, getExecutiveMetrics, getProviderBreakdown, getSpendSeries } from "@/lib/overview";
import type { CostDriver, ExecMetric } from "@/lib/overview";
import { getDataSource } from "@/lib/sync";
import { getPreferences } from "@/lib/preferences-actions";
import { constraintsFrom, hasActiveConstraints } from "@/lib/preferences";
import { usd } from "@/lib/format";
import { BarList } from "@/components/charts";
import { GridScoreGauge } from "@/components/GridScore";
import { SpendTimeline } from "@/components/SpendTimeline";
import { Card, Delta, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const TONE_COLOR: Record<string, string> = { good: "#3fe39a", warn: "#e8a33c", bad: "#ff5d5d" };

export default async function CommandCenterPage() {
  const prefs = await getPreferences();
  const constraints = constraintsFrom(prefs);

  const [metrics, gs, series, providers, drivers, byModelAll, byTeam, dataSource] = await Promise.all([
    getExecutiveMetrics(constraints),
    getGridScoreSummary(constraints),
    getSpendSeries(),
    getProviderBreakdown(),
    getCostDrivers(),
    getByModel(),
    getByTeam(),
    getDataSource(),
  ]);
  const byModel = byModelAll.slice(0, 6);

  const providerTotal = providers.reduce((s, p) => s + p.cost, 0);
  const annualSavings = gs.savings * 12;

  return (
    <div className="mx-auto flex max-w-[1360px] flex-col gap-8">
      {dataSource.source === "sample" && (
        <Link
          href="/integrations"
          className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/[0.06] px-4 py-3 transition-colors hover:border-brand/55"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">✦</span>
            <div>
              <div className="text-sm font-medium text-ink">You&rsquo;re exploring sample data</div>
              <div className="text-xs text-ink-muted">Make it yours — upload a CSV or enter your numbers. No sign-up needed.</div>
            </div>
          </div>
          <span className="press inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-bg group-hover:brightness-110">
            Add your data <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </Link>
      )}
      {/* ── LEVEL 1 · Executive snapshot ─────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Executive snapshot</SectionLabel>
          {hasActiveConstraints(prefs) && (
            <Link href="/settings" className="pill text-brass transition-colors hover:border-brass/40">
              Personalized · your preferences
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map((m) => (
            <MetricCard key={m.id} m={m} />
          ))}
        </div>
      </section>

      {/* ── Optimization opportunity · the action moment ─────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-brass/30 bg-bg-card p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brass/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-x-10 gap-y-6">
          <div className="min-w-[260px] flex-1">
            <div className="stat-label text-brass">GridMind optimization opportunity</div>
            <div className="mt-1.5 flex items-end gap-3">
              <span className="tnum text-4xl font-semibold tracking-tight text-ink">{usd(gs.savings)}</span>
              <span className="mb-1 text-sm text-ink-muted">/ month available</span>
            </div>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">
              Cut <span className="font-medium text-brass">{gs.savingsPct.toFixed(0)}%</span> of spend and lift your{" "}
              <span className="font-medium text-ink">GridScore™ {gs.current.score} → {gs.optimized.score}</span> by routing workloads to
              optimal placements — about <span className="tnum font-medium text-ink">{usd(annualSavings)}</span>/yr, no performance loss.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <GridScoreGauge score={gs.current.score} grade={gs.current.grade} size={92} label="Current" />
            <span className="text-brass">→</span>
            <GridScoreGauge score={gs.optimized.score} grade={gs.optimized.grade} size={92} label="Optimized" />
          </div>
          <div className="flex flex-col items-stretch gap-2">
            <Link href="/routing" className="press group inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-bg hover:brightness-110">
              See routing plan <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link href="/simulator" className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm text-ink-muted hover:border-line-bright hover:text-ink">
              Run simulation
            </Link>
          </div>
        </div>
      </section>

      {/* ── LEVEL 2 · Spending timeline ──────────────────────────────── */}
      <section>
        <SectionLabel className="mb-3">Spending over time</SectionLabel>
        <SpendTimeline daily={series.daily} forecast={series.forecast} />
      </section>

      {/* ── LEVEL 2 · Provider breakdown + Top cost drivers ──────────── */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.25fr]">
        <Card className="card-pad">
          <SectionTitle title="Provider breakdown" hint="Spend by infrastructure provider · 30d" right={<span className="pill">{providers.length} active</span>} />
          <div className="flex flex-col gap-3.5">
            {providers.map((p) => (
              <div key={p.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: p.accent }} />
                    <span className="truncate font-medium text-ink">{p.label}</span>
                    <span className="hidden text-[10px] uppercase tracking-wider text-ink-faint sm:inline">{p.kind}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="tnum text-ink-muted">{usd(p.cost, { compact: true })}</span>
                    <span className="tnum w-9 text-right text-ink-faint">{p.sharePct.toFixed(0)}%</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/60">
                  <div className="h-full rounded-full" style={{ width: `${p.sharePct}%`, background: p.accent }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs">
            <span className="text-ink-faint">Total · last 30 days</span>
            <span className="tnum font-semibold text-ink">{usd(providerTotal)}</span>
          </div>
        </Card>

        <Card className="card-pad">
          <SectionTitle title="Top cost drivers" hint="What's moving your bill" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {drivers.map((d) => (
              <DriverCard key={d.id} d={d} />
            ))}
          </div>
        </Card>
      </section>

      {/* ── LEVEL 3 · Cost analytics preview ─────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="card-pad">
          <SectionTitle title="Cost by model" hint="Top spenders · 30d" right={<Link href="/budget" className="text-xs text-brand hover:underline">Details →</Link>} />
          <BarList items={byModel} unit="usd" />
        </Card>
        <Card className="card-pad">
          <SectionTitle title="Cost by team" hint="Chargeback view · 30d" right={<Link href="/budget" className="text-xs text-brand hover:underline">Details →</Link>} />
          <BarList items={byTeam.map((t, i) => ({ ...t, accent: ["#ecb84c", "#ff9a5c", "#b08cff", "#3fe39a", "#e8a33c"][i % 5] }))} unit="usd" />
        </Card>
      </section>

      {/* ── Go deeper · navigation to detailed analysis ──────────────── */}
      <section>
        <SectionLabel className="mb-3">Go deeper</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <LaunchCard href="/routing" title="Routing" stat={`${usd(gs.savings, { compact: true })}/mo`} sub="optimize placement" />
          <LaunchCard href="/gridscore" title="GridScore" stat={`${gs.current.score}`} sub={`→ ${gs.optimized.score} possible`} />
          <LaunchCard href="/budget" title="Budget" stat="Forecast" sub="waste & alerts" />
          <LaunchCard href="/simulator" title="Simulator" stat="What-if" sub="model your spend" />
          <LaunchCard href="/map" title="Compute Map" stat="13 regions" sub="cost & carbon" />
          <LaunchCard href="/marketplace" title="Marketplace" stat="Live" sub="buy & reserve" />
        </div>
      </section>

    </div>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint ${className}`}>{children}</h2>;
}

function MetricCard({ m }: { m: ExecMetric }) {
  const valueColor = m.tone ? TONE_COLOR[m.tone] : m.accent;
  return (
    <div className="card card-pad">
      <div className="stat-label">{m.label}</div>
      <div className="mt-2 flex items-center gap-2">
        <span className="tnum text-2xl font-semibold tracking-tight text-ink" style={valueColor ? { color: valueColor } : undefined}>
          {m.value}
        </span>
        {m.tone && <span className="h-2 w-2 rounded-full" style={{ background: TONE_COLOR[m.tone] }} />}
      </div>
      {m.deltaPct !== undefined ? (
        <div className="mt-1.5">
          <Delta value={m.deltaPct} goodWhenDown={m.goodWhenDown} suffix="" />
        </div>
      ) : null}
      <div className="mt-1 text-xs text-ink-faint">{m.sub}</div>
    </div>
  );
}

const DRIVER_STYLE: Record<CostDriver["kind"], { color: string; glyph: string }> = {
  increase: { color: "#ff5d5d", glyph: "▲" },
  decrease: { color: "#3fe39a", glyph: "▼" },
  expensive: { color: "#ffd97a", glyph: "◆" },
  efficient: { color: "#3fe39a", glyph: "✓" },
};

function DriverCard({ d }: { d: CostDriver }) {
  const s = DRIVER_STYLE[d.kind];
  return (
    <div className="rounded-xl border border-line bg-bg-raised p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-ink-faint">{d.label}</span>
        <span className="text-xs" style={{ color: s.color }}>{s.glyph}</span>
      </div>
      <div className="mt-1.5 truncate text-sm font-semibold text-ink">{d.name}</div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] text-ink-faint">{d.meta}</span>
        <span className="tnum shrink-0 text-sm font-semibold" style={{ color: s.color }}>{d.value}</span>
      </div>
    </div>
  );
}

function LaunchCard({ href, title, stat, sub }: { href: string; title: string; stat: string; sub: string }) {
  return (
    <Link href={href} className="lift group flex flex-col rounded-xl border border-line bg-bg-card p-4 transition-colors hover:border-brand/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className="text-ink-faint transition-transform group-hover:translate-x-0.5">→</span>
      </div>
      <span className="tnum mt-2 text-lg font-semibold text-brand">{stat}</span>
      <span className="text-[11px] text-ink-faint">{sub}</span>
    </Link>
  );
}
