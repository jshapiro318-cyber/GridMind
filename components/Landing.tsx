"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { HeroPanel } from "./HeroPanel";
import { BrandMark } from "./BrandMark";
import { WaitlistForm } from "./WaitlistForm";
import { Scene3D } from "./Scene3D";
import { PROVIDERS, hourlyRate, providerById, regionById } from "@/lib/catalog";
import { regionPriceFactor } from "@/lib/routing";
import { scorePlacement } from "@/lib/gridscore";
import { usd } from "@/lib/format";
import { REGION_PHOTOS } from "@/lib/regionPhotos";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// ── Light "Noomo" landing palette (scoped here; the app stays dark) ──────────
// Light lavender page (noomoagency.com's #c9d2e7), near-black giant type, GOLD
// kept as the brand accent + the floating object, deep GREEN for savings.
const C = {
  ink: "#0b0e15",        // near-black headings
  body: "#3c4350",       // body text
  muted: "#6b7280",      // muted
  faint: "#8b93a3",      // faint labels
  gold: "#9a6f12",       // deep gold — readable accent on light
  goldLine: "#caa23a",   // gold borders / highlight
  green: "#0c8f59",      // savings green on light
  line: "#c4cdde",       // hairlines
  card: "#ffffff",       // cards
  glassBtn: "border border-[#0b0e15]/20 bg-white/40 text-[#222732] backdrop-blur transition hover:bg-white/70",
};

// ── Data (computed once, from the real catalog) ──────────────────────────────
const PRICE_ROWS = PROVIDERS.filter((p) => p.gpuIds.includes("h100"))
  .map((p) => {
    let best = Infinity, region = "";
    for (const rid of p.regionIds) {
      const r = regionById(rid);
      if (!r) continue;
      const h = hourlyRate("h100", p.id) * regionPriceFactor(r.electricityCents);
      if (h < best) { best = h; region = r.city; }
    }
    return { id: p.id, short: p.short, kind: p.kind, rate: best, region };
  })
  .sort((a, b) => a.rate - b.rate);
const PMAX = PRICE_ROWS[PRICE_ROWS.length - 1].rate;
const PSPREAD = Math.round(((PMAX - PRICE_ROWS[0].rate) / PMAX) * 100);

const WE = (() => {
  const gpuHrs = 8 * 720;
  const dear = PRICE_ROWS[PRICE_ROWS.length - 1];
  const cheap = PRICE_ROWS[0];
  const dearCost = gpuHrs * dear.rate;
  const cheapCost = gpuHrs * cheap.rate;
  const saved = dearCost - cheapCost;
  return { gpuHrs, dear, cheap, dearCost, cheapCost, saved, pct: Math.round((saved / dearCost) * 100) };
})();

function regionData(id: string) {
  const r = regionById(id)!;
  let best = Infinity, prov = "";
  for (const p of PROVIDERS) {
    if (!p.gpuIds.includes("h100") || !p.regionIds.includes(id)) continue;
    const h = hourlyRate("h100", p.id) * regionPriceFactor(r.electricityCents);
    if (h < best) { best = h; prov = p.id; }
  }
  return { r, h100: best, prov, score: scorePlacement(prov, id).score };
}
const REGIONS = [
  { id: "sa-east-1", tag: "Saving money", why: "Cheap hydro power and a low-carbon grid — the most compute for the dollar." },
  { id: "ca-central", tag: "Balance", why: "The all-rounder: cleanest grid, low power price and dependable latency." },
  { id: "eu-north-1", tag: "The greenest grid", why: "98% renewable at 24g CO₂/kWh — the lowest-carbon compute on the map." },
].map((x) => ({ ...x, ...regionData(x.id) }));

const CHAPTERS = [
  { n: "01", t: "Connect every cloud", d: "Eight clouds and every GPU fleet, read into one live model of spend, carbon and capacity — no agents, no rip-and-replace." },
  { n: "02", t: "Score every placement", d: "GridScore™ rates every provider and region 0–100 on cost, carbon, latency and reliability — so the trade-offs stop being invisible." },
  { n: "03", t: "Plan it in one click", d: "One click turns the recommendation into a step-by-step migration plan — yours to apply in your own console or IaC. GridMind plans the move; it never touches your account." },
];
const OLD = ["Default to the nearest hyperscaler", "Pay on-demand list price, every hour", "Find out you overspent at month-end", "Carbon nobody is tracking"];
const NEW = ["Route each job to its cheapest home", "Neoclouds, reserved and spot — scored live", "Forecasts and anomaly alerts, live", "Greenest grid weighed into every move"];
const AUDIENCE = [
  { role: "The platform lead", body: "You own the GPU budget and the SLAs. GridMind cuts the bill without re-architecting or trading away performance." },
  { role: "The FinOps owner", body: "You answer to the CFO. Per-team attribution, a real forecast and anomaly alerts — in one place." },
  { role: "The founder", body: "You want proof, not a sales call. Open the dashboard and dig into every number yourself." },
];
const PRICING: {
  name: string; price: string; per: string; from?: boolean; note?: string;
  feats: string[]; hi: boolean; cta: string; href: string;
}[] = [
  { name: "Read-only demo", price: "Free", per: "", note: "no sign-up, no card", feats: ["The full app on a sample fleet", "GridScore, routing & simulator", "Illustrative figures — explore it all"], hi: false, cta: "Open the demo", href: "/dashboard" },
  { name: "Startup", price: "$99", per: "/mo", feats: ["Unified dashboard", "Up to 3 providers", "30-day history"], hi: false, cta: "Get started", href: "/billing" },
  { name: "Growth", price: "$499", per: "/mo", feats: ["All 8 providers", "AI routing + GridScore", "CSV & API import"], hi: true, cta: "Get started", href: "/billing" },
  { name: "Business", price: "$1,999", per: "/mo", from: true, note: "or 1–2% of optimized spend, whichever is greater", feats: ["Team chargeback", "Anomaly detection", "SSO + RBAC"], hi: false, cta: "Talk to sales", href: "mailto:hello@gridmind.ai" },
  { name: "Enterprise", price: "Custom", per: "", note: "a volume rate on optimized spend", feats: ["Dedicated routing", "Private integrations", "Priority support"], hi: false, cta: "Talk to sales", href: "mailto:hello@gridmind.ai" },
];

const HOT = [100, 112, 126, 142, 160, 181, 205, 232, 263];
const COOL = [100, 84, 76, 75, 78, 82, 87, 92, 98];
const cx = (i: number) => 40 + (i / (HOT.length - 1)) * 380;
const cy = (v: number) => 250 - (v / 280) * 210;
const cLine = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${cx(i).toFixed(1)} ${cy(v).toFixed(1)}`).join(" ");

// Typography rule: ALL landing display headlines use the editorial serif
// (font-serif / .display-*). The grotesque (font-display) and mono are reserved
// for UI chrome and labels only — one consistent headline voice top to bottom.
const PANEL = "panel relative z-10 flex min-h-screen w-full items-center justify-center px-6 py-24 sm:px-10";
const SOLID = "bg-white/55 backdrop-blur-md";
const GIANT = "panel relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6 py-24 text-center";

export function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    const apply = () => setAnimate(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useIsoLayoutEffect(() => {
    if (!animate || !root.current) return;
    let lenis: Lenis | undefined;
    let ticker: ((t: number) => void) | undefined;
    let ctx: ReturnType<typeof gsap.context> | undefined;
    try {
      gsap.registerPlugin(ScrollTrigger);
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
      lenis = new Lenis({ duration: 1.4, easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -9 * t)), smoothWheel: true, wheelMultiplier: 1, syncTouch: true });
      lenis.on("scroll", ScrollTrigger.update);
      ticker = (t: number) => lenis?.raf(t * 1000);
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);

      ctx = gsap.context(() => {
        // noomoagency.com MOVEMENT (DOM approximation): continuous heavy-inertia scroll
        // (above) with LAYERED parallax — text lags slightly while cards/visuals glide at a
        // clearly different rate, so sections read as dimensional layers passing, not a flat
        // 1:1 scroll. No pin (no stop-start, no dead transit zones).
        const sections = gsap.utils.toArray<HTMLElement>(".panel");
        sections.forEach((section, i) => {
          const stage = section.querySelector<HTMLElement>("[class*='max-w-']");
          if (!stage) return;
          gsap.set(stage, { willChange: "transform, opacity" });
          // reveal as the section rises into view
          if (i > 0) gsap.from(stage, { autoAlpha: 0, y: 72, duration: 1.15, ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 80%", once: true } });
          // text drifts slowly (lags the page)
          gsap.fromTo(stage, { yPercent: -14 }, { yPercent: 14, ease: "none", force3D: true,
            scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1 } });
          // depth layers (cards / visuals) glide at a faster, contrasting rate
          section.querySelectorAll<HTMLElement>("[data-depth]").forEach((d) =>
            gsap.fromTo(d, { yPercent: 50 }, { yPercent: -50, ease: "none", force3D: true,
              scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.5 } }));
          // city photos: an aggressive scroll-scrubbed push-in — the camera punches deep
          // into the city as you scroll it in, so the still reads like cinematic footage.
          section.querySelectorAll<HTMLElement>(".rx-photo").forEach((photo) =>
            gsap.fromTo(photo, { scale: 1.2 }, { scale: 4.2, ease: "power2.in", force3D: true, transformOrigin: "50% 42%",
              scrollTrigger: { trigger: section, start: "top bottom", end: "center center", scrub: 0.45 } }));
        });
        ScrollTrigger.refresh();
      }, root);
    } catch {
      try { gsap.utils.toArray<HTMLElement>("[class*='max-w-']").forEach((el) => gsap.set(el, { clearProps: "all" })); } catch {}
    }
    return () => {
      try { ctx?.revert(); } catch {}
      if (ticker) gsap.ticker.remove(ticker);
      try { lenis?.destroy(); } catch {}
    };
  }, [animate]);

  return (
    <div ref={root} className="relative overflow-x-clip font-display text-[#222732]" style={{ background: "linear-gradient(180deg,#e4e9f4 0%,#cdd6e8 42%,#c4cee3 100%)" }}>
      {/* Restrained WebGL backdrop: a gold form + scroll-driven camera for 3D depth */}
      <Scene3D />

      {/* Nav */}
      <nav aria-label="Primary" className="fixed inset-x-0 top-0 z-50 border-b border-[#b9c3d8]/70 bg-[#cdd6e8]/65 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="GridMind home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#b9c3d8] bg-white text-[#9a6f12]"><BrandMark size={18} /></span>
            <span className="text-[15px] font-semibold tracking-tight text-[#0b0e15]">GridMind</span>
          </Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Open dashboard →</Link>
        </div>
      </nav>

      <main className="relative z-10 pt-16">
        {/* 1 · Hero */}
        <section className={PANEL}>
          <div className="grid w-full max-w-[1180px] grid-cols-1 items-center gap-y-12 lg:grid-cols-[1.05fr_minmax(0,380px)] lg:gap-x-14">
            <div>
              <p className="mb-7 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#6b7280]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#caa23a]" /> Live across 8 clouds · 13 regions
              </p>
              <h1 className="font-serif text-[clamp(2.8rem,6.4vw,5.6rem)] font-bold leading-[0.95] tracking-[-0.03em] text-[#0b0e15] [text-wrap:balance]">Run AI compute where it costs <span className="text-[#9a6f12]">the least.</span></h1>
              <p className="lead mt-7 max-w-xl font-sans text-[#3c4350] [text-wrap:pretty]">
                GridMind gives every placement a 0–100 GridScore across cost, carbon and latency, then routes each workload to the
                cheapest place it can run. Average reduction: <span className="text-[#0c8f59]">27%</span>, zero performance loss.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3.5">
                <Link href="/dashboard" className="btn btn-primary">Open the dashboard →</Link>
                <Link href="/routing" className={`btn ${C.glassBtn}`}>See it route</Link>
              </div>
              <p className="mt-7 font-mono text-[11px] uppercase tracking-[0.18em] text-[#6b7280]">Built for ML platform leads · FinOps owners · AI-native founders</p>
            </div>
            <div className="flex justify-center lg:justify-end" data-depth><HeroPanel /></div>
          </div>
          <div className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-[#6b7280]">
            Scroll<span className="animate-bounce text-sm leading-none">⌄</span>
          </div>
        </section>

        {/* 2 · Chapter — OBSERVE */}
        <GiantChapter {...CHAPTERS[0]} />

        {/* 3 · The math */}
        <section className={`${PANEL} ${SOLID}`}>
          <div className="grid w-full max-w-[1100px] grid-cols-1 items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <h2 className="display-2 text-[#0b0e15] [text-wrap:balance]">Every month you wait, the gap <span className="text-[#9a6f12]">widens.</span></h2>
              <p className="lead mt-5 max-w-md font-sans text-[#3c4350] [text-wrap:pretty]">Left alone, AI spend compounds with usage and the premium you pay for defaulting to the nearest hyperscaler. Re-routing bends the curve the moment you turn it on.</p>
              <div className="mt-8 flex gap-10">
                <div><div className="tnum text-3xl font-extrabold text-[#0c8f59]">−27%</div><div className="mt-1 font-sans text-sm text-[#3c4350]">typical monthly spend</div></div>
                <div><div className="tnum text-3xl font-extrabold text-[#0b0e15]">1 click</div><div className="mt-1 font-sans text-sm text-[#3c4350]">to deploy a re-route</div></div>
              </div>
            </div>
            <div data-depth>
              <svg viewBox="0 0 440 280" className="w-full" role="img" aria-label="Cost over 12 months: doing nothing rises steeply; GridMind stays low.">
                {[0, 0.33, 0.66, 1].map((t) => <line key={t} x1="40" x2="420" y1={40 + t * 210} y2={40 + t * 210} stroke="#c2cad9" strokeWidth="1" />)}
                <path d={`${cLine(COOL)} L${cx(COOL.length - 1)} 250 L40 250 Z`} fill="#0c8f59" fillOpacity="0.1" />
                <path d={cLine(HOT)} fill="none" stroke="#9aa3b4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={cLine(COOL)} fill="none" stroke="#0c8f59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <text x={cx(HOT.length - 1)} y={cy(HOT[HOT.length - 1]) - 8} textAnchor="end" className="fill-[#7d8696] font-mono text-[13px]">Do nothing</text>
                <text x={cx(COOL.length - 1)} y={cy(COOL[COOL.length - 1]) + 18} textAnchor="end" className="fill-[#0c8f59] font-mono text-[13px]">With GridMind</text>
              </svg>
            </div>
          </div>
        </section>

        {/* 4 · Prices */}
        <section className={`${PANEL} ${SOLID}`}>
          <div className="grid w-full max-w-[1100px] grid-cols-1 items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9a6f12]">Evidence · provider spread</p>
              <h2 className="display-2 mt-4 text-[#0b0e15]">One H100. Eight prices.</h2>
              <p className="lead mt-5 max-w-md font-sans text-[#3c4350] [text-wrap:pretty]">The same GPU, at each provider&apos;s best region. The cheapest comes in <span className="text-[#0c8f59]">{PSPREAD}% under</span> the priciest — that gap is the savings GridMind captures.</p>
            </div>
            <div className="flex flex-col gap-2.5" data-depth>
              {PRICE_ROWS.map((row, i) => (
                <div key={row.id} className="flex items-center gap-4">
                  <div className="w-20 shrink-0 text-right font-sans text-sm text-[#222732]">{row.short}</div>
                  <div className="relative h-9 flex-1 overflow-hidden rounded-md bg-[#dde3f1]">
                    <div className="absolute inset-y-0 left-0 rounded-md" style={{ width: `${(row.rate / PMAX) * 100}%`, background: i === 0 ? "#13a96f" : "#e2d3a6" }} />
                    <div className="relative flex h-full items-center justify-between px-3">
                      <span className={`font-mono text-[10px] uppercase tracking-wider ${i === 0 ? "text-white/90" : "text-[#7a6f55]"}`}>{row.kind} · {row.region}</span>
                      <span className={`tnum text-sm font-semibold ${i === 0 ? "text-white" : "text-[#222732]"}`}>{usd(row.rate, { cents: true })}/hr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5 · Worked example */}
        <section id="worked-example" className={`${PANEL} ${SOLID} scroll-mt-24`}>
          <div className="grid w-full max-w-[1100px] grid-cols-1 items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9a6f12]">Evidence · one real workload</p>
              <h2 className="display-2 mt-4 text-[#0b0e15] [text-wrap:balance]">Same node, one month, <span className="text-[#9a6f12]">two bills.</span></h2>
              <p className="lead mt-5 max-w-md font-sans text-[#3c4350] [text-wrap:pretty]">
                An 8× H100 node run flat out for 30 days — {WE.gpuHrs.toLocaleString()} GPU-hours. Nothing about the job changes. Only where it runs.
              </p>
              <p className="mt-6 font-mono text-xs text-[#8b93a3]">Live catalog rates · {WE.dear.short} vs {WE.cheap.short} · before any reservation discount</p>
            </div>
            <div className="flex flex-col gap-4" data-depth>
              <div className="rounded-2xl border border-[#c4cdde] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6b7280]">{WE.dear.short} · {WE.dear.region}</span>
                  <span className="font-mono text-[11px] text-[#8b93a3]">nearest default</span>
                </div>
                <div className="tnum mt-2 text-[2.1rem] font-bold leading-none text-[#0b0e15]">{usd(WE.dearCost)}<span className="ml-1 text-sm font-normal text-[#8b93a3]">/mo</span></div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#e7ebf5]"><div className="h-full rounded-full bg-[#dcc98f]" style={{ width: "100%" }} /></div>
              </div>
              <div className="rounded-2xl border border-[#0c8f59]/35 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#0c8f59]">GridMind → {WE.cheap.short} · {WE.cheap.region}</span>
                  <span className="font-mono text-[11px] text-[#0c8f59]">routed</span>
                </div>
                <div className="tnum mt-2 text-[2.1rem] font-bold leading-none text-[#0c8f59]">{usd(WE.cheapCost)}<span className="ml-1 text-sm font-normal text-[#8b93a3]">/mo</span></div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#e7ebf5]"><div className="h-full rounded-full bg-[#13a96f]" style={{ width: `${(WE.cheapCost / WE.dearCost) * 100}%` }} /></div>
              </div>
              <div className="flex items-baseline justify-between border-t border-[#c4cdde] pt-4">
                <span className="font-sans text-sm text-[#3c4350]">You keep, every month</span>
                <span className="tnum text-2xl font-extrabold text-[#0c8f59]">{usd(WE.saved)} <span className="text-base font-semibold">· −{WE.pct}%</span></span>
              </div>
              <p className="font-mono text-[11px] text-[#8b93a3]">≈ {usd(WE.saved * 12)} a year — on a single node</p>
            </div>
          </div>
        </section>

        {/* 6 · Chapter — SCORE */}
        <GiantChapter {...CHAPTERS[1]} />

        {/* 7–9 · Regions */}
        {REGIONS.map((d) => {
          const photo = REGION_PHOTOS[d.id];
          const place = d.r.name.replace(/\s*\(.*\)/, "");
          return (
            <section key={d.id} className={`${PANEL} overflow-hidden`}>
              <div className="absolute inset-0" aria-hidden>
                {photo && (
                  <>
                    <div className="rx-photo absolute inset-[-8%] bg-cover bg-center" style={{ backgroundImage: `url(${photo.src})`, filter: "grayscale(0.48) contrast(1.1) brightness(1.05) saturate(1.08) sepia(0.12)" }} />
                    {/* champagne→lavender duotone grades the city into the brand palette */}
                    <div className="absolute inset-0 mix-blend-soft-light" style={{ background: "linear-gradient(118deg, rgba(202,162,58,0.5), rgba(205,214,232,0.12) 56%, rgba(110,100,80,0.32))" }} />
                  </>
                )}
                {/* readability wash + cinematic top/bottom vignette + gold key light */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#cdd6e8] via-[#cdd6e8]/86 to-[#cdd6e8]/22" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(205,214,232,0.9), transparent 24%, transparent 78%, rgba(205,214,232,0.5))" }} />
                <div className="absolute inset-0" style={{ background: "radial-gradient(56% 62% at 66% 46%, rgba(236,184,76,0.24), transparent 72%)" }} />
              </div>
              <div className="relative w-full max-w-[1100px]">
                <p className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-[#9a6f12]"><span className="h-1.5 w-1.5 rounded-full bg-[#caa23a]" /> Best for · {d.tag}</p>
                <h3 className="mt-3 font-serif text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[0.9] tracking-[-0.03em] text-[#0b0e15]">{d.id === "sa-east-1" ? "Rio de Janeiro" : d.r.city}</h3>
                <p className="mt-2 font-mono text-sm uppercase tracking-[0.18em] text-[#3c4350]">{place === d.r.country ? d.r.country : `${place} · ${d.r.country}`}</p>
                <p className="mt-4 max-w-md font-sans text-base text-[#3c4350] [text-wrap:pretty]">{d.why}</p>
                <div className="mt-9 grid max-w-2xl grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-4">
                  <Metric big value={usd(d.h100, { cents: true })} unit="/hr" label="H100 · best price" tone="text-[#0c8f59]" />
                  <Metric value={`${d.r.electricityCents.toFixed(1)}¢`} label="electricity / kWh" />
                  <Metric value={`${d.r.carbon}`} unit="g" label="grid carbon / kWh" />
                  <Metric value={`${d.score}`} label="GridScore™" tone="text-[#9a6f12]" />
                </div>
                <p className="mt-7 font-mono text-xs text-[#6b7280]">best on <span className="text-[#222732]">{providerById(d.prov)?.name}</span> · {d.r.renewablePct}% renewable · {d.r.latencyMs} ms latency</p>
              </div>
              {photo && <span className="absolute bottom-4 right-5 font-mono text-[10px] text-[#5b6474]/80">Photo · {photo.credit}</span>}
            </section>
          );
        })}

        {/* 10 · Chapter — ROUTE */}
        <GiantChapter {...CHAPTERS[2]} />

        {/* 11 · Proof */}
        <section className={`${PANEL} ${SOLID}`}>
          <div className="w-full max-w-[1100px]">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9a6f12]">The difference</p>
            <h2 className="display-2 mt-4 text-[#0b0e15] [text-wrap:balance]">Where a workload runs decides what it costs.</h2>
            <div className="mt-11 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#c4cdde] bg-[#c4cdde] md:grid-cols-2">
              <div className="bg-white p-8">
                <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-[#6b7280]">Without GridMind</h3>
                <ul className="mt-5 flex flex-col gap-3.5">
                  {OLD.map((t) => (<li key={t} className="flex items-start gap-3 font-sans text-sm text-[#3c4350]"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#a7afbe]" /> {t}</li>))}
                </ul>
              </div>
              <div className="bg-white p-8">
                <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-[#0c8f59]">With GridMind</h3>
                <ul className="mt-5 flex flex-col gap-3.5">
                  {NEW.map((t) => (<li key={t} className="flex items-start gap-3 font-sans text-sm text-[#222732]"><span className="text-[#0c8f59]">✓</span> {t}</li>))}
                </ul>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-[#c4cdde] pt-8 sm:grid-cols-4">
              <Metric value="−27%" label="avg monthly spend" tone="text-[#0c8f59]" />
              <Metric value={`${PSPREAD}%`} label="provider price spread" tone="text-[#9a6f12]" />
              <Metric value="13" label="regions scored live" />
              <Metric value="0" label="performance lost" />
            </div>
          </div>
        </section>

        {/* 12 · Built for */}
        <section className={`${PANEL} ${SOLID}`}>
          <div className="w-full max-w-[1100px]">
            <h2 className="display-2 text-[#0b0e15] [text-wrap:balance]">Built for the people who own the bill.</h2>
            <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#c4cdde] bg-[#c4cdde] md:grid-cols-3">
              {AUDIENCE.map((a) => (
                <div key={a.role} className="flex flex-col bg-white p-8">
                  <h3 className="font-serif text-xl font-bold tracking-[-0.01em] text-[#0b0e15]">{a.role}</h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-[#3c4350] [text-wrap:pretty]">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 13 · Pricing */}
        <section className={`${PANEL} ${SOLID}`}>
          <div className="w-full max-w-[1180px]">
            <h2 className="display-2 text-[#0b0e15]">Plans &amp; pricing.</h2>
            <p className="mt-3 max-w-xl font-sans text-[#3c4350] [text-wrap:pretty]">
              Most teams save more in <span className="font-semibold text-[#0b0e15]">week one</span> than a year of the plan.{" "}
              <a href="#worked-example" className="font-semibold text-[#9a6f12] underline decoration-[#caa23a]/40 underline-offset-2 transition-colors hover:decoration-[#caa23a]">See the math →</a>
            </p>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {PRICING.map((t) => (
                <div key={t.name} className={`flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm ${t.hi ? "border-[#caa23a]/70 ring-1 ring-[#caa23a]/30" : "border-[#c4cdde]"}`}>
                  {t.hi && <span className="mb-3 w-max rounded-full border border-[#caa23a]/50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#9a6f12]">Most popular</span>}
                  <h3 className="text-lg font-semibold text-[#0b0e15]">{t.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    {t.from && <span className="font-sans text-sm text-[#8b93a3]">from</span>}
                    <span className="tnum text-4xl font-bold tracking-[-0.03em] text-[#0b0e15]">{t.price}</span>
                    <span className="font-sans text-sm text-[#8b93a3]">{t.per}</span>
                  </div>
                  {t.note && <p className="mt-1.5 min-h-[2.4em] font-sans text-xs leading-snug text-[#6b7280]">{t.note}</p>}
                  <ul className="mt-5 flex flex-1 flex-col gap-2.5 font-sans text-sm text-[#3c4350]">
                    {t.feats.map((f) => <li key={f} className="flex items-start gap-2"><span className="mt-0.5 text-[#0c8f59]">✓</span> {f}</li>)}
                  </ul>
                  <Link href={t.href} className={`btn btn-sm mt-6 w-full ${t.hi ? "btn-primary" : C.glassBtn}`}>{t.cta}</Link>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-2xl font-sans text-xs leading-relaxed text-[#8b93a3]">Figures shown are illustrative. Business &amp; Enterprise bill on a small percentage of the spend GridMind optimizes — so pricing scales with the value delivered, not a flat fee. Start on the read-only demo, no sign-up.</p>
          </div>
        </section>

        {/* 14 · CTA */}
        <section className={`${PANEL} justify-center text-center`}>
          <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(60% 58% at 50% 44%, rgba(231,236,245,0.96), rgba(231,236,245,0.7) 42%, rgba(231,236,245,0) 78%)" }} />
          <div className="relative z-10 mx-auto w-full max-w-[760px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#caa23a]/50 bg-white/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#9a6f12]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0c8f59]" /> Interactive demo live · early access opening
            </span>
            <h2 className="mt-5 font-serif text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.96] tracking-[-0.03em] text-[#0b0e15] [text-wrap:balance]">See your own numbers in <span className="text-[#9a6f12]">two minutes.</span></h2>
            <p className="lead mx-auto mt-6 max-w-md font-sans text-[#3c4350] [text-wrap:pretty]">Explore the live demo now — no sign-up. Want your own spend in? Join the early-access list.</p>
            <WaitlistForm />
            <div><Link href="/dashboard" className="mt-7 inline-block font-sans text-sm font-semibold text-[#9a6f12] underline decoration-[#caa23a]/40 underline-offset-2 transition-colors hover:decoration-[#caa23a]">Or open the interactive demo →</Link></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#b3bdd2] bg-[#bcc6dc] px-6 py-16">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#a9b4ca] bg-white text-[#9a6f12]"><BrandMark size={18} /></span>
            <span className="text-[15px] font-semibold tracking-tight text-[#0b0e15]">GridMind</span>
            <span className="ml-3 font-sans text-sm text-[#5b6474]">© 2026 — the operating system for AI compute</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 font-sans text-sm text-[#5b6474]">
            <Link href="/dashboard" className="transition-colors hover:text-[#0b0e15]">Demo</Link>
            <Link href="/signin" className="transition-colors hover:text-[#0b0e15]">Sign in</Link>
            <Link href="/privacy" className="transition-colors hover:text-[#0b0e15]">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-[#0b0e15]">Terms</Link>
            <a href="mailto:hello@gridmind.ai" className="transition-colors hover:text-[#0b0e15]">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

// A full-screen editorial "step" moment — a real headline (not an abstract word),
// carried by the same Noomo-style pin/hand-off transition as every other section.
function GiantChapter({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <section className={GIANT}>
      {/* Readability plate — a soft light radial so the gold 3D form behind never lowers contrast under centred type. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(48% 42% at 50% 50%, rgba(231,236,245,0.92), rgba(231,236,245,0) 72%)" }} />
      <div className="relative z-10 mx-auto max-w-[860px]">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-[#9a6f12]">{n} / 03 · How it works</p>
        <h2 className="mt-6 font-serif text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[0.98] tracking-[-0.03em] text-[#0b0e15] [text-wrap:balance]">{t}</h2>
        <p className="mx-auto mt-7 max-w-xl font-sans text-lg leading-relaxed text-[#3c4350] [text-wrap:pretty]">{d}</p>
      </div>
    </section>
  );
}

const Metric = ({ value, unit, label, big, tone }: { value: string; unit?: string; label: string; big?: boolean; tone?: string }) => (
  <div>
    <div className={`tnum font-semibold tracking-[-0.02em] ${big ? "text-4xl sm:text-5xl" : "text-2xl"} ${tone ?? "text-[#0b0e15]"}`}>
      {value}{unit && <span className="ml-0.5 text-base font-normal text-[#8b93a3]">{unit}</span>}
    </div>
    <div className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b6474]">{label}</div>
  </div>
);
