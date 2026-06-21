"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin gradient beam at the very top that tracks scroll progress. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return <motion.div style={{ scaleX }} className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-brand via-electric to-brass" aria-hidden />;
}
