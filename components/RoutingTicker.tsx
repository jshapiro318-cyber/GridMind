"use client";

// A slim "live re-routes" strip — the dynamic, on-brand replacement for a plain
// logo marquee. Decorative (aria-hidden); the CSS marquee freezes statically
// under prefers-reduced-motion via the global rule, leaving the events readable.

const RE = [
  { gpu: "H100 ×64", from: "AWS · N. Virginia", to: "Lambda · Oregon", save: "−31%" },
  { gpu: "A100 ×128", from: "Azure · Frankfurt", to: "Crusoe · Texas", save: "−28%" },
  { gpu: "H200 ×32", from: "GCP · Tokyo", to: "Together · Oregon", save: "−24%" },
  { gpu: "L40S ×96", from: "AWS · Ireland", to: "RunPod · Texas", save: "−35%" },
  { gpu: "A100 ×40", from: "Azure · Singapore", to: "CoreWeave · Virginia", save: "−22%" },
  { gpu: "H100 ×200", from: "GCP · Mumbai", to: "Lambda · Oregon", save: "−33%" },
];

export function RoutingTicker() {
  const row = [...RE, ...RE];
  return (
    <div className="relative flex items-center gap-4 border-y border-line bg-bg-raised/40 py-3" aria-hidden>
      <span className="ml-6 hidden shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand sm:flex">
        <span className="h-1.5 w-1.5 animate-pulseNode rounded-full bg-brand" /> Live re-routes
      </span>
      <div className="edge-fade min-w-0 flex-1 overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-9 whitespace-nowrap will-change-transform">
          {row.map((e, i) => (
            <span key={i} className="flex items-center gap-2.5 font-mono text-xs">
              <span className="text-ink">{e.gpu}</span>
              <span className="text-ink-faint">{e.from}</span>
              <span className="text-brand">→</span>
              <span className="text-ink-muted">{e.to}</span>
              <span className="font-semibold text-brand">{e.save}</span>
              <span className="text-line-bright">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
