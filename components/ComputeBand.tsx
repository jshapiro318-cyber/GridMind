"use client";

import { HeroScene } from "./HeroScene";
import { Parallax } from "./Parallax";

// A full-bleed cinematic break: the live compute network behind an editorial
// overline. Parallax + canvas give it depth; the canvas is decorative so it's
// hidden from assistive tech, and the headline stands on its own.

export function ComputeBand() {
  return (
    <section className="relative flex h-[82vh] min-h-[520px] items-center overflow-hidden border-y border-line">
      <div className="absolute inset-0" aria-hidden>
        <Parallax amount={70} className="absolute inset-0 h-full w-full">
          <HeroScene className="h-full w-full" onNode={() => {}} />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/35 to-bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-transparent to-transparent" />
        <div className="vignette pointer-events-none absolute inset-0" />
      </div>
      <div className="section relative" data-reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Global compute, watched live</p>
        <h2 className="display-2 mt-4 max-w-2xl text-ink-bright [text-wrap:balance]" data-parallax="-7">
          Every region, priced by the second — cost, carbon and capacity.
        </h2>
        <p className="lead mt-5 max-w-md font-sans text-ink-muted [text-wrap:pretty]">
          Eight providers, thirteen regions, one map. GridMind reads them all and sends each workload to wherever it runs
          cheapest and cleanest right now.
        </p>
      </div>
    </section>
  );
}
