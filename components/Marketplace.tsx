"use client";

import { useMemo, useState } from "react";
import { GPU_OPTIONS, type Listing, type ListingKind, generateListings } from "@/lib/marketplace";
import { num, usd } from "@/lib/format";
import { ScoreChip } from "./GridScore";

const KIND_STYLE: Record<ListingKind, { label: string; color: string }> = {
  "on-demand": { label: "On-demand", color: "#ecb84c" },
  spot: { label: "Spot", color: "#e8a33c" },
  reserved: { label: "Reserved", color: "#b08cff" },
};

type Sort = "gridscore" | "price" | "availability" | "perf";
const QTY = 8;

export function Marketplace() {
  const listings = useMemo(() => generateListings(), []);
  const [kind, setKind] = useState<ListingKind | "all">("all");
  const [gpu, setGpu] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("gridscore");
  const [order, setOrder] = useState<Record<string, { price: number; bid: boolean }>>({});
  const [checkedOut, setCheckedOut] = useState(false);

  const filtered = useMemo(() => {
    let list = listings.filter((l) => (kind === "all" || l.kind === kind) && (gpu === "all" || l.gpuId === gpu));
    list = [...list].sort((a, b) => {
      if (sort === "gridscore") return b.gridScore - a.gridScore || a.pricePerHr - b.pricePerHr;
      if (sort === "price") return a.pricePerHr - b.pricePerHr;
      if (sort === "availability") return b.availableGpus - a.availableGpus;
      return b.perf - a.perf;
    });
    return list;
  }, [listings, kind, gpu, sort]);

  const stats = useMemo(() => {
    const avail = listings.reduce((s, l) => s + l.availableGpus, 0);
    const cheapest = Math.min(...listings.map((l) => l.pricePerHr));
    const providers = new Set(listings.map((l) => l.providerId)).size;
    return { avail, cheapest, providers };
  }, [listings]);

  const orderLines = Object.entries(order)
    .map(([id, v]) => ({ listing: listings.find((l) => l.id === id)!, ...v }))
    .filter((o) => o.listing);
  const orderTotalHr = orderLines.reduce((s, o) => s + o.price * QTY, 0);
  const orderGpus = orderLines.length * QTY;

  const toggle = (l: Listing, bid: boolean) => {
    setCheckedOut(false);
    setOrder((prev) => {
      const next = { ...prev };
      if (next[l.id] && next[l.id].bid === bid) delete next[l.id];
      else next[l.id] = { price: bid ? l.pricePerHr * 0.92 : l.pricePerHr, bid };
      return next;
    });
  };

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5 pb-24">
      {/* Sell-side CTA + stats — note: not reveal-group'd so the live grid doesn't re-animate on every filter */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-card p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-electric/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="stat-label text-electric">Compute order book</div>
              <span className="rounded-full border border-electric/30 bg-electric/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-electric">Preview</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
              {num(stats.avail)} GPUs available across {stats.providers} providers
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Buy on-demand, grab spot capacity, or bid on reserved tranches — from {usd(stats.cheapest, { cents: true })}/GPU-hr.
            </p>
            <p className="mt-2 max-w-xl text-xs text-ink-faint">
              Preview — prices are modeled and indicative. Reserving and bidding build a shortlist to act on in your provider&rsquo;s console; GridMind never places orders or moves money.
            </p>
          </div>
          <button className="press rounded-lg border border-line px-4 py-2.5 text-sm text-ink-muted transition-colors hover:border-electric/40 hover:text-ink">
            List your capacity →
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterGroup>
          {(["all", "on-demand", "spot", "reserved"] as const).map((k) => (
            <FilterChip key={k} active={kind === k} onClick={() => setKind(k)}>
              {k === "all" ? "All types" : KIND_STYLE[k].label}
            </FilterChip>
          ))}
        </FilterGroup>
        <select
          value={gpu}
          onChange={(e) => setGpu(e.target.value)}
          className="rounded-lg border border-line bg-bg-card px-3 py-1.5 text-xs text-ink-muted outline-none hover:border-line-bright"
        >
          <option value="all">All GPUs</option>
          {GPU_OPTIONS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-lg border border-line bg-bg-card px-3 py-1.5 text-xs text-ink-muted outline-none hover:border-line-bright"
        >
          <option value="gridscore">Sort: GridScore</option>
          <option value="price">Sort: Price</option>
          <option value="availability">Sort: Availability</option>
          <option value="perf">Sort: Performance</option>
        </select>
        <span className="ml-auto text-xs text-ink-faint">{filtered.length} offers</span>
      </div>

      {/* Listings grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((l) => {
          const ks = KIND_STYLE[l.kind];
          const inOrder = order[l.id];
          const availPct = (l.availableGpus / l.totalGpus) * 100;
          return (
            <div key={l.id} className={`card lift card-pad flex flex-col gap-3 ${l.recommended ? "border-brand/45 shadow-glow" : inOrder ? "border-brand/40" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: l.accent }} />
                  <span className="truncate text-sm font-semibold text-ink">{l.providerShort}</span>
                  <span className="hidden text-[10px] uppercase tracking-wider text-ink-faint sm:inline">{l.providerKind}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {l.recommended && (
                    <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand">★ Recommended</span>
                  )}
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: ks.color, background: ks.color + "14" }}>
                    {ks.label}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-base font-semibold tracking-tight text-ink">{l.gpuName}</h3>
                  <span className="text-[11px] text-ink-faint">{l.vramGB}GB</span>
                </div>
                <p className="text-xs text-ink-muted">
                  {l.regionCity}, {l.regionCountry} · {l.latencyMs}ms
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <span className="tnum text-2xl font-semibold text-ink">{usd(l.pricePerHr, { cents: true })}</span>
                  <span className="text-xs text-ink-faint"> /GPU-hr</span>
                </div>
                {l.discountPct > 0 && (
                  <span className="tnum rounded-md bg-leaf/10 px-1.5 py-0.5 text-[11px] font-medium text-leaf">−{Math.round(l.discountPct)}% vs on-demand</span>
                )}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-ink-faint">
                  <span>{num(l.availableGpus)} available</span>
                  <span className="flex items-center gap-1.5">
                    GridScore <ScoreChip score={l.gridScore} grade={l.grade} />
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full" style={{ width: `${availPct}%`, background: l.accent }} />
                </div>
              </div>

              <div className="mt-1 flex gap-2">
                <button
                  onClick={() => toggle(l, false)}
                  className={`press flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    inOrder && !inOrder.bid ? "bg-brand text-bg" : "border border-line text-ink hover:border-brand/40 hover:text-brand"
                  }`}
                >
                  {inOrder && !inOrder.bid ? "Reserved ✓" : "Reserve"}
                </button>
                <button
                  onClick={() => toggle(l, true)}
                  className={`press flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    inOrder && inOrder.bid ? "bg-violet text-bg" : "border border-line text-ink-muted hover:border-violet/50 hover:text-violet"
                  }`}
                >
                  {inOrder && inOrder.bid ? "Bid placed ✓" : "Bid −8%"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order bar */}
      {orderLines.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-30 w-[min(880px,calc(100%-2rem))] -translate-x-1/2 lg:left-[calc(50%+122px)]">
          <div className="animate-riseIn flex flex-wrap items-center gap-4 rounded-2xl border border-line-bright bg-bg-raised/95 px-5 py-3.5 shadow-card backdrop-blur">
            <div className="flex items-center gap-4">
              <div>
                <div className="stat-label">Order</div>
                <div className="tnum text-sm font-semibold text-ink">{orderLines.length} lines · {orderGpus} GPUs</div>
              </div>
              <div>
                <div className="stat-label">Blended rate</div>
                <div className="tnum text-sm font-semibold text-brand">{usd(orderTotalHr, { cents: true })}/hr</div>
              </div>
              <div className="hidden sm:block">
                <div className="stat-label">Est. monthly</div>
                <div className="tnum text-sm font-semibold text-ink">{usd(orderTotalHr * 730)}</div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {checkedOut && <span className="text-xs text-leaf">✓ Saved to your shortlist</span>}
              <button onClick={() => setOrder({})} className="rounded-lg border border-line px-3 py-2 text-xs text-ink-muted hover:text-ink">
                Clear
              </button>
              <button onClick={() => setCheckedOut(true)} className="press rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-bg hover:brightness-110">
                Save to shortlist →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex rounded-lg border border-line p-0.5">{children}</div>;
}
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-md px-2.5 py-1 text-xs transition-colors ${active ? "bg-bg-hover text-ink" : "text-ink-muted hover:text-ink"}`}>
      {children}
    </button>
  );
}
