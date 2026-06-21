"use client";

import { useEffect, useRef } from "react";

interface Blob {
  hue: string;
  bx: number;
  by: number;
  r: number;
  ax: number;
  ay: number;
  sx: number;
  sy: number;
  ph: number;
}

/** Slowly drifting soft-gradient field — a lightweight WebGL-free "aurora". */
export function AuroraCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const blobs: Blob[] = [
      { hue: "236,184,76", bx: 0.28, by: 0.32, r: 0.42, ax: 0.06, ay: 0.05, sx: 0.00021, sy: 0.00017, ph: 0 },
      { hue: "255,180,62", bx: 0.72, by: 0.4, r: 0.46, ax: 0.07, ay: 0.06, sx: 0.00016, sy: 0.00023, ph: 2 },
      { hue: "142,139,214", bx: 0.55, by: 0.7, r: 0.4, ax: 0.05, ay: 0.05, sx: 0.00019, sy: 0.00015, ph: 4 },
      { hue: "63,227,154", bx: 0.4, by: 0.55, r: 0.34, ax: 0.05, ay: 0.04, sx: 0.00024, sy: 0.0002, ph: 1 },
    ];

    let raf = 0;
    let t = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      t += 16;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        const cx = (b.bx + Math.sin(t * b.sx + b.ph) * b.ax) * w;
        const cy = (b.by + Math.cos(t * b.sy + b.ph) * b.ay) * h;
        const rad = b.r * Math.min(w, h);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, `rgba(${b.hue},0.22)`);
        g.addColorStop(0.5, `rgba(${b.hue},0.08)`);
        g.addColorStop(1, `rgba(${b.hue},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
