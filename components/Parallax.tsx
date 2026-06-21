"use client";

import { useRef, type ReactNode } from "react";
import { MotionConfig, motion, useScroll, useTransform } from "framer-motion";

/**
 * Scroll-linked parallax: child drifts on the Y axis as the element passes
 * through the viewport. Subtle by default — depth, not distraction.
 */
export function Parallax({ children, amount = 60, className = "" }: { children: ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  return (
    <MotionConfig reducedMotion="user">
      <motion.div ref={ref} style={{ y }} className={className}>
        {children}
      </motion.div>
    </MotionConfig>
  );
}
