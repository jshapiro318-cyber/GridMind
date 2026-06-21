"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import type { ReactNode } from "react";

/**
 * 21st.dev / Aceternity-style spotlight card — a soft radial light follows the
 * cursor across the surface. Pure pointer interaction (no effect on touch).
 */
export function SpotlightCard({
  children,
  className = "",
  glow = "rgba(236,184,76,0.18)",
  radius = 360,
}: {
  children: ReactNode;
  className?: string;
  glow?: string;
  radius?: number;
}) {
  const mx = useMotionValue(-9999);
  const my = useMotionValue(-9999);
  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${mx}px ${my}px, ${glow}, transparent 72%)`;

  return (
    <div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onMouseLeave={() => {
        mx.set(-9999);
        my.set(-9999);
      }}
      className={`group relative overflow-hidden ${className}`}
    >
      <motion.div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background }} aria-hidden />
      {children}
    </div>
  );
}
