import Link from "next/link";
import { PROVIDERS } from "@/lib/catalog";
import { priceIndex, cellRate, shortProvider, PRICE_INDEX_DATE, type GpuPriceRow } from "@/lib/price-index";
import { usd } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "GPU Price Index — H100, H200 & A100 $/hr Across 8 Clouds · GridMind",
  description:
    "Compare modeled on-demand GPU prices — H100, H200, A100, L40S and more — across AWS, GCP, Azure, CoreWeave, Lambda, Crusoe, Together and RunPod. The same H100 ranges nearly 2× depending on where you run it.",
  alternates: { canonical: `${SITE_URL}/gpu-prices` },
  openGraph: {
    title: "GPU Price Index — One H100, Eight Prices",
    description: `Modeled cross-cloud on-demand $/hr for H100, H200, A100 and more. Reviewed ${PRICE_INDEX_DATE}.`,
    url: `${SITE_URL}/gpu-prices`,
    type: "website",
  },
};

const ROWS = priceIndex();
const H100 = ROWS.find((r) => r.gpu.id === "h100");
const COLS = PROVIDERS.map((p) => ({ id: p.id, short: shortProvider(p.name), kind: p.kind }));

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "GridMind GPU Price Index",
  description:
    "Modeled cross-cloud on-demand hourly prices for NVIDIA H100, H200, A100, L40S and other AI accelerators across eight cloud and neocloud providers.",
  url: `${SITE_URL}/gpu-prices`,
  creator: { "@type": "Organization", name: "GridMind" },
  variableMeasured: ["GPU on-demand price (USD/hr)", "Provider", "Region"],
  isAccessibleForFree: true,
};

export default function GpuPricesPage() {
  return (
    <div className="app-backdrop min-h-screen">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-ink-faint transition-colors hover:text-ink-muted">← GridMind</Link>
          <span className="rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Free · public index</span>
        </div>

        <h1 className="mt-7 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">GPU Price Index</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-muted sm:text-base">
          The same GPU costs wildly different amounts depending on which cloud you rent it from. Below is a
          cross-cloud view of on-demand $/hr for the accelerators teams actually train and serve on —
          NVIDIA H100, H200, A100, L40S and more — across eight hyperscalers and neoclouds.
        </p>

        {H100 && (
          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="tnum text-3xl font-extrabold tracking-tight text-brand">{usd(H100.cheapest.rate, { cents: true })}/hr</span>
            <span className="text-sm text-ink-muted">
              cheapest modeled H100 ({H100.cheapest.short}, {H100.cheapest.region}) — vs {usd(H100.max, { cents: true })} at the priciest.
              That&apos;s a <b className="text-ink">{H100.spreadX}×</b> spread on one chip.
            </span>
          </div>
        )}

        {/* Methodology — the honesty box. */}
        <div className="mt-8 rounded-xl border border-line bg-bg-card/60 p-5 text-[13.5px] leading-relaxed text-ink-muted">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">How these numbers are built</p>
          <p className="mt-2.5">
            These are <b className="text-ink">indicative on-demand rates, modeled — not live quotes.</b> Each starts from a
            GPU&apos;s public reference list price, applies a per-provider pricing factor (hyperscalers carry a premium,
            neoclouds discount), and adjusts for regional power cost — then shows each provider at its cheapest qualifying
            region. List rates reviewed <b className="text-ink">{PRICE_INDEX_DATE}</b>. Always confirm current pricing with the
            provider before committing spend — and to see your <i>actual</i> blended rates, connect your own billing or
            upload a CSV in <Link href="/dashboard" className="text-brand underline underline-offset-2 hover:brightness-110">the app</Link>.
          </p>
        </div>

        {/* H100 hero — one chip, eight prices. */}
        {H100 && (
          <section className="mt-12">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-ink">NVIDIA H100 — one chip, {H100.rates.length} prices</h2>
              <span className="font-mono text-[11px] text-ink-faint">cheapest region per provider</span>
            </div>
            <div className="mt-5 flex flex-col gap-2.5">
              {H100.rates.map((row, i) => (
                <div key={row.id} className="flex items-center gap-3 sm:gap-4">
                  <div className="w-20 shrink-0 text-right text-sm text-ink sm:w-24">{row.short}</div>
                  <div className="relative h-9 flex-1 overflow-hidden rounded-md bg-bg-card">
                    <div className="absolute inset-y-0 left-0 rounded-md" style={{ width: `${(row.rate / H100.max) * 100}%`, background: i === 0 ? "#ecb84c" : "#3a4252" }} />
                    <div className="relative flex h-full items-center justify-between px-3">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{row.kind} · {row.region}</span>
                      <span className={`tnum text-sm font-semibold ${i === 0 ? "text-bg" : "text-ink"}`}>{usd(row.rate, { cents: true })}/hr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Full matrix — every GPU × every provider. */}
        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Every accelerator, every cloud</h2>
          <p className="mt-2 text-sm text-ink-muted">Modeled best on-demand $/hr. The cheapest in each row is highlighted; &ldquo;—&rdquo; means the provider doesn&apos;t list that GPU.</p>
          <div className="mt-5 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-card/50">
                  <th className="sticky left-0 z-10 bg-bg-card/95 px-4 py-3 text-left font-semibold text-ink">GPU</th>
                  {COLS.map((c) => (
                    <th key={c.id} className="px-3 py-3 text-right font-medium text-ink-muted">{c.short}</th>
                  ))}
                  <th className="px-4 py-3 text-right font-semibold text-ink">Spread</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row: GpuPriceRow) => (
                  <tr key={row.gpu.id} className="border-b border-line/60 last:border-0 hover:bg-bg-card/40">
                    <th scope="row" className="sticky left-0 z-10 bg-bg/95 px-4 py-3 text-left">
                      <span className="block font-semibold text-ink">{row.gpu.name.replace("NVIDIA ", "")}</span>
                      <span className="block font-mono text-[11px] text-ink-faint">{row.gpu.vramGB}GB</span>
                    </th>
                    {COLS.map((c) => {
                      const v = cellRate(row.gpu.id, c.id);
                      const isMin = v != null && Math.abs(v - row.min) < 1e-6;
                      return (
                        <td key={c.id} className={`tnum px-3 py-3 text-right ${v == null ? "text-ink-faint/50" : isMin ? "font-bold text-brand" : "text-ink-muted"}`}>
                          {v == null ? "—" : usd(v, { cents: true })}
                        </td>
                      );
                    })}
                    <td className="tnum px-4 py-3 text-right font-semibold text-ink">{row.spreadX}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-mono text-[11px] text-ink-faint">
            Modeled list rates × regional power factor · reviewed {PRICE_INDEX_DATE} · not a live quote.
          </p>
        </section>

        {/* CTA */}
        <section className="mt-14 rounded-2xl border border-line bg-bg-card/50 p-7 sm:p-9">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">See your real numbers, not the list</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
            This index is the public, modeled view. GridMind shows your <i>actual</i> blended rates, where your spend is
            leaking, and the cheapest place to run each workload — across exactly these providers. Read-only, and it
            recommends moves rather than making them. Start with sample data, a CSV, or your own billing.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn btn-primary">Open the live demo →</Link>
            <Link href="/integrations" className="btn btn-ghost">Upload a billing CSV</Link>
            <Link href="/security" className="btn btn-ghost">How we handle your data</Link>
          </div>
        </section>

        <p className="mt-10 border-t border-line pt-6 text-xs text-ink-faint">
          Prices are modeled estimates for orientation only and may differ from any provider&apos;s current rates. See our{" "}
          <Link href="/terms" className="text-ink-muted underline underline-offset-2 hover:text-ink">Terms</Link>. GPU names and provider marks belong to their owners.
        </p>
      </div>
    </div>
  );
}
