"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { PROVIDERS, hourlyRate, providerById, regionById } from "@/lib/catalog";
import { regionPriceFactor } from "@/lib/routing";
import { scorePlacement } from "@/lib/gridscore";
import { usd } from "@/lib/format";
import { REGION_PHOTOS } from "@/lib/regionPhotos";

// ─────────────────────────────────────────────────────────────────────────────
// Region explorer — two beats per city. Beat 1: the photo + the city name + the
// "best for…" verdict establish the place. Beat 2: scroll down, the photo keeps
// zooming and the real GPU-cost data zooms up to back the verdict. Honest numbers
// from the catalog/routing engine; photos from Unsplash.
// ─────────────────────────────────────────────────────────────────────────────

const FEATURED = ["sa-east-1", "ca-central", "eu-north-1", "us-west-2", "ap-south-1", "eu-central-1"];

const PURPOSE: Record<string, { tag: string; why: string }> = {
  "sa-east-1": { tag: "Saving money", why: "Cheap hydro power and a low-carbon grid — the most compute for the dollar." },
  "ca-central": { tag: "Balance", why: "The all-rounder: cleanest grid, low power price and dependable latency." },
  "eu-north-1": { tag: "The greenest grid", why: "98% renewable at 24g CO₂/kWh — the lowest-carbon compute on the map." },
  "us-west-2": { tag: "Cheap, clean scale", why: "7¢ power and 86% renewable — low cost without the carbon penalty." },
  "ap-south-1": { tag: "Lowest power price", why: "Cheap electricity, but a heavy grid — pick it for cost, not for carbon." },
  "eu-central-1": { tag: "European latency", why: "Central EU and data-residency friendly — a premium to stay close to users." },
};

function regionData(id: string) {
  const r = regionById(id)!;
  let best = Infinity;
  let bestProvider = "";
  for (const p of PROVIDERS) {
    if (!p.gpuIds.includes("h100") || !p.regionIds.includes(id)) continue;
    const h = hourlyRate("h100", p.id) * regionPriceFactor(r.electricityCents);
    if (h < best) {
      best = h;
      bestProvider = p.id;
    }
  }
  const score = bestProvider ? scorePlacement(bestProvider, id).score : 0;
  return { r, h100: best === Infinity ? null : best, provider: bestProvider, score };
}

const DATA = FEATURED.map(regionData).filter((d) => d.h100 != null);

export function RegionShowcase() {
  return (
    <section id="regions" className="relative">
      <div className="section section-y">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand" data-reveal data-parallax="-7">Evidence · the same GPU, priced by place</p>
        <h2 className="display-2 mt-4 max-w-3xl text-ink-bright [text-wrap:balance]" data-reveal data-parallax="-11">
          The cheapest H100 on Earth costs less than half the most expensive.
        </h2>
        <p className="lead mt-5 max-w-xl font-sans text-ink-muted [text-wrap:pretty]" data-reveal>
          Same silicon, wildly different bills. Scroll through six regions — each one shows you the place, then zooms in on
          what it&apos;s best for and what it costs.
        </p>
      </div>
      {DATA.map((d, i) => (
        <RegionPanel key={d.r.id} d={d} index={i} total={DATA.length} />
      ))}
    </section>
  );
}

function RegionPanel({ d, index, total }: { d: ReturnType<typeof regionData>; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // Photo zooms continuously the whole way through — the "cool zoom".
  const photoScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.5]);
  const photoOpacity = useTransform(scrollYProgress, [0, 0.08, 0.9, 1], [0, 1, 1, 0]);
  // Beat 1 — establish the place (verdict + name) first.
  const estOpacity = useTransform(scrollYProgress, [0.08, 0.2, 0.84, 0.93], [0, 1, 1, 0]);
  const estY = useTransform(scrollYProgress, [0.08, 0.3], [44, 0]);
  // Hint to keep scrolling — shows after the name, fades as the data arrives.
  const hintOpacity = useTransform(scrollYProgress, [0.2, 0.28, 0.4, 0.46], [0, 1, 1, 0]);
  // Beat 2 — the data zooms up to back the verdict.
  const dataOpacity = useTransform(scrollYProgress, [0.42, 0.56, 0.84, 0.93], [0, 1, 1, 0]);
  const dataY = useTransform(scrollYProgress, [0.42, 0.62], [70, 0]);
  const dataScale = useTransform(scrollYProgress, [0.42, 0.64], [0.88, 1]);

  const { r } = d;
  const photo = REGION_PHOTOS[r.id];
  const purpose = PURPOSE[r.id];
  const lat = `${Math.abs(r.lat).toFixed(2)}°${r.lat >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(r.lon).toFixed(2)}°${r.lon >= 0 ? "E" : "W"}`;
  const place = r.name.replace(/\s*\(.*\)/, "");
  const sub = place.toLowerCase() === r.country.toLowerCase() ? r.country : `${place} · ${r.country}`;

  return (
    <div ref={ref} className="relative h-[210vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden border-t border-line">
        {/* Auto-zooming city photo */}
        <motion.div className="absolute inset-0" style={reduced ? undefined : { scale: photoScale, opacity: photoOpacity }} aria-hidden>
          {photo ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${photo.src})`, filter: "grayscale(0.62) contrast(1.05) brightness(0.6)" }} />
          ) : (
            <div className="absolute inset-0 bg-bg-raised" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-bg/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/60" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(58% 58% at 66% 42%, rgba(236,184,76,0.12), transparent 72%)" }} />
        </motion.div>

        <div className="section relative w-full">
          {/* Beat 1 — establish */}
          <motion.div style={reduced ? undefined : { y: estY, opacity: estOpacity }}>
            <div className="flex items-center gap-3 font-mono text-xs text-ink-faint">
              <span className="tnum text-brand">{String(index + 1).padStart(2, "0")}</span>
              <span className="h-px w-8 bg-line-bright" />
              <span className="tnum">{lat} · {lon}</span>
              <span className="tnum">{index + 1}/{total}</span>
            </div>
            {purpose && (
              <p className="mt-6 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Best for · {purpose.tag}
              </p>
            )}
            <h3 className="mt-3 font-serif text-[clamp(2.6rem,8.5vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.02em] text-ink-bright">
              {r.city}
            </h3>
            <p className="mt-2 font-mono text-sm uppercase tracking-[0.18em] text-ink-muted">{sub}</p>
          </motion.div>

          {/* scroll hint (between beats) */}
          {!reduced && (
            <motion.p style={{ opacity: hintOpacity }} className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint" aria-hidden>
              <span className="inline-block h-5 w-px animate-pulse bg-gradient-to-b from-brand to-transparent" /> scroll to zoom in
            </motion.p>
          )}

          {/* Beat 2 — the data zooms in */}
          <motion.div
            className="mt-6 origin-left"
            style={reduced ? undefined : { y: dataY, opacity: dataOpacity, scale: dataScale }}
          >
            {purpose && <p className="max-w-md font-sans text-base leading-relaxed text-ink-muted [text-wrap:pretty]">{purpose.why}</p>}
            <div className="mt-7 grid max-w-2xl grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-4">
              <Metric big value={usd(d.h100 ?? 0, { cents: true })} unit="/hr" label="H100 · best price" gold />
              <Metric value={`${r.electricityCents.toFixed(1)}¢`} label="electricity / kWh" />
              <Metric value={`${r.carbon}`} unit="g" label="grid carbon / kWh" />
              <Metric value={`${d.score}`} label="GridScore™" gold />
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-ink-faint">
              <span>best on <span className="text-ink">{providerById(d.provider)?.name}</span></span>
              <span>·</span>
              <span>{r.renewablePct}% renewable</span>
              <span>·</span>
              <span>{r.latencyMs} ms latency</span>
              <span>·</span>
              <span>{r.availability >= 0.6 ? "ample" : "tight"} capacity</span>
            </div>
          </motion.div>
        </div>

        {photo && <span className="absolute bottom-4 right-5 font-mono text-[10px] text-ink-faint/80">Photo · {photo.credit}</span>}
      </div>
    </div>
  );
}

const Metric = ({ value, unit, label, big, gold }: { value: string; unit?: string; label: string; big?: boolean; gold?: boolean }) => (
  <div>
    <div className={`tnum font-semibold tracking-[-0.02em] ${big ? "text-4xl sm:text-5xl" : "text-2xl"} ${gold ? "text-brand" : "text-ink-bright"}`}>
      {value}
      {unit && <span className="ml-0.5 text-base font-normal text-ink-faint">{unit}</span>}
    </div>
    <div className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</div>
  </div>
);
