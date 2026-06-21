"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Animated glow-border (magicui "border beam" family): a bright wedge sweeps
 * around a 1px frame while a quiet base border holds the shape. Built with
 * Framer Motion; respects reduced-motion (the beam simply holds still).
 */
export function BeamBorder({
  children,
  className = "",
  color = "#ecb84c",
  duration = 7,
  radius = "1rem",
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  duration?: number;
  radius?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-line-bright/60 p-px ${className}`} style={{ borderRadius: radius }}>
      <motion.div
        className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: `conic-gradient(from 0deg, transparent 0deg 250deg, ${color} 318deg, #f3f6fb 332deg, ${color} 346deg, transparent 360deg)` }}
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
        aria-hidden
      />
      <div className="relative h-full bg-bg-card" style={{ borderRadius: `calc(${radius} - 1px)` }}>
        {children}
      </div>
    </div>
  );
}
