"use client";

import { useRef } from "react";
import { MotionConfig, type MotionValue, motion, useScroll, useTransform } from "framer-motion";

const TEXT = "Every AI workload, routed to its perfect place — automatically.";
const WORDS = TEXT.split(" ");
const HOT = new Set(["perfect", "automatically."]); // brass-highlit words

function Word({ word, index, total, progress }: { word: string; index: number; total: number; progress: MotionValue<number> }) {
  // stagger each word across the scroll, with a soft overlap window
  const start = index / total;
  const end = start + 1 / total;
  const opacity = useTransform(progress, [start, end], [0.14, 1]);
  const yp = useTransform(progress, [start, end], [14, 0]);
  const blur = useTransform(progress, [start, end], [6, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  return (
    <motion.span style={{ opacity, y: yp, filter }} className={`mr-[0.28em] inline-block ${HOT.has(word) ? "text-brass" : "text-ink"}`}>
      {word}
    </motion.span>
  );
}

export function KineticStatement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.55"] });
  const washOpacity = useTransform(scrollYProgress, [0, 0.4, 0.9, 1], [0, 1, 1, 0]);
  const washX = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const lineX = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <MotionConfig reducedMotion="user">
      <section ref={ref} className="relative h-[200vh]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          {/* shifting colour wash — the bold moment */}
          <motion.div style={{ opacity: washOpacity, x: washX }} className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute left-[8%] top-1/2 h-[60vh] w-[60vh] -translate-y-1/2 rounded-full bg-brand/20 blur-[120px]" />
            <div className="absolute right-[6%] top-1/3 h-[46vh] w-[46vh] rounded-full bg-brass/18 blur-[120px]" />
          </motion.div>

          <div className="relative mx-auto w-full max-w-[1180px] px-6">
            <p className="text-[clamp(2rem,5.2vw,4.2rem)] font-extrabold leading-[1.12] tracking-[-0.03em]">
              {WORDS.map((w, i) => (
                <Word key={i} word={w} index={i} total={WORDS.length} progress={scrollYProgress} />
              ))}
            </p>
            {/* progress hairline */}
            <div className="relative mt-10 h-px w-full overflow-hidden bg-line">
              <motion.div style={{ width: lineX }} className="h-full bg-gradient-to-r from-brand to-brass" />
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
