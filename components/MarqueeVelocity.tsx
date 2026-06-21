"use client";

import { useRef } from "react";
import { motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity, wrap } from "framer-motion";

/**
 * Noomo-style velocity marquee: a continuous base drift that speeds up, reverses
 * direction, and skews based on scroll velocity. Pure Framer Motion.
 */
function Row({ items, baseVelocity, sep }: { items: string[]; baseVelocity: number; sep: string }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 4], { clamp: false });
  const skew = useSpring(useTransform(scrollVelocity, [-1200, 1200], [-6, 6]), { damping: 50, stiffness: 400 });

  // wrap the four copies: -25% slides exactly one copy out before resetting
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    let moveBy = dir.current * baseVelocity * (delta / 1000);
    const vf = velocityFactor.get();
    if (vf < 0) dir.current = -1;
    else if (vf > 0) dir.current = 1;
    moveBy += dir.current * moveBy * Math.abs(vf);
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden">
      <motion.div className="flex w-max whitespace-nowrap will-change-transform" style={{ x, skewX: skew }}>
        {[0, 1, 2, 3].map((c) => (
          <span key={c} className="flex shrink-0 items-center">
            {items.map((m) => (
              <span key={`${c}-${m}`} className="flex items-center gap-10 pr-10 font-mono text-sm tracking-wide text-ink-faint">
                {m}
                <span className="text-brand/40">{sep}</span>
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function MarqueeVelocity({ items, sep = "/" }: { items: string[]; sep?: string }) {
  return (
    <div className="border-y border-line bg-bg-raised/40 py-4">
      <Row items={items} baseVelocity={2.4} sep={sep} />
    </div>
  );
}
