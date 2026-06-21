import { PROVIDERS, hourlyRate, regionById } from "@/lib/catalog";
import { regionPriceFactor } from "@/lib/routing";
import { usd } from "@/lib/format";

// Representative best H100 $/hr per provider = the cheapest region they offer it
// in. Straight from the catalog/routing math — concrete evidence of the spread.
const ROWS = PROVIDERS.filter((p) => p.gpuIds.includes("h100"))
  .map((p) => {
    let best = Infinity;
    let region = "";
    for (const rid of p.regionIds) {
      const r = regionById(rid);
      if (!r) continue;
      const h = hourlyRate("h100", p.id) * regionPriceFactor(r.electricityCents);
      if (h < best) {
        best = h;
        region = r.city;
      }
    }
    return { id: p.id, name: p.name, kind: p.kind, rate: best, region };
  })
  .sort((a, b) => a.rate - b.rate);

const MIN = ROWS[0].rate;
const MAX = ROWS[ROWS.length - 1].rate;
const SPREAD = Math.round(((MAX - MIN) / MAX) * 100);

export function ProviderPrices() {
  return (
    <section className="section section-y">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div data-reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Evidence · provider spread</p>
          <h2 className="display-2 mt-4 text-ink-bright [text-wrap:balance]" data-parallax="-9">One H100. Eight prices.</h2>
          <p className="lead mt-5 font-sans text-ink-muted [text-wrap:pretty]">
            The exact same GPU, at each provider&apos;s best region. The cheapest comes in <span className="text-ink">{SPREAD}% under</span> the
            priciest — that gap is the savings GridMind captures, automatically.
          </p>
          <div className="mt-8 flex items-baseline gap-3">
            <span className="tnum text-5xl font-extrabold tracking-[-0.03em] text-brand">{usd(MIN, { cents: true })}</span>
            <span className="font-sans text-sm text-ink-muted">cheapest H100 / hr · {ROWS[0].region}</span>
          </div>
        </div>

        <div data-reveal data-parallax="6" className="flex flex-col gap-2.5">
          {ROWS.map((row, i) => (
            <div key={row.id} className="group flex items-center gap-4">
              <div className="w-24 shrink-0 text-right font-sans text-sm">
                <span className="text-ink">{row.name.replace(" Labs", "").replace(" AI", "").replace("Amazon Web Services", "AWS").replace("Google Cloud", "GCP").replace("Microsoft Azure", "Azure")}</span>
              </div>
              <div className="relative h-9 flex-1 overflow-hidden rounded-md bg-bg-card">
                <div
                  className="absolute inset-y-0 left-0 rounded-md"
                  style={{ width: `${(row.rate / MAX) * 100}%`, background: i === 0 ? "#ecb84c" : "#4b3a2b" }}
                />
                <div className="relative flex h-full items-center justify-between px-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{row.kind} · {row.region}</span>
                  <span className={`tnum text-sm font-semibold ${i === 0 ? "text-bg" : "text-ink"}`}>{usd(row.rate, { cents: true })}/hr</span>
                </div>
              </div>
            </div>
          ))}
          <p className="mt-2 font-mono text-[11px] text-ink-faint">Catalog list rates × regional power factor · illustrative, not a live quote.</p>
        </div>
      </div>
    </section>
  );
}
