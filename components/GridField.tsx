"use client";

import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// GridField — a persistent floating cluster of metallic-gold cubes: GridMind's
// "compute grid". This is the analog of noomoagency.com's persistent 3D object:
// a fixed, full-viewport sculpture that rotates slowly and PARALLAXES with scroll
// while the page's giant type passes in front of it. Canvas 2.5D (projected cubes,
// painter-sorted), dpr-capped, reduced-motion-safe (renders one static frame).
// ─────────────────────────────────────────────────────────────────────────────

type V = { x: number; y: number; z: number };

const ROT_Y = (p: V, a: number): V => ({ x: p.x * Math.cos(a) + p.z * Math.sin(a), y: p.y, z: -p.x * Math.sin(a) + p.z * Math.cos(a) });
const ROT_X = (p: V, a: number): V => ({ x: p.x, y: p.y * Math.cos(a) - p.z * Math.sin(a), z: p.y * Math.sin(a) + p.z * Math.cos(a) });

// A loose plus/grid arrangement of cube centres (echoes Noomo's chrome blocks).
const CELLS: V[] = [
  { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 }, { x: 1, y: 1, z: 0 },
  { x: -1, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
  { x: 1, y: 0, z: 1 }, { x: -1, y: 0, z: -1 }, { x: 0, y: 1, z: 1 }, { x: 0, y: -1, z: -1 },
];

export function GridField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, w = 0, h = 0, dpr = 1;
    const FOCAL = 640;
    const GAP = 132; // spacing between cube centres
    const CUBE = 48; // cube half-size

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const project = (p: V, cx: number, cy: number) => {
      const s = FOCAL / (FOCAL + p.z);
      return { x: cx + p.x * s, y: cy + p.y * s, s };
    };

    // the six faces of a cube, by corner index where corner = (sx,sy,sz) bit-packed
    const FACES: { pts: number[]; shade: number }[] = [
      { pts: [4, 5, 7, 6], shade: 1.0 },  // +x  (bright)
      { pts: [0, 2, 3, 1], shade: 0.5 },  // -x
      { pts: [2, 6, 7, 3], shade: 0.82 }, // +y
      { pts: [0, 1, 5, 4], shade: 0.36 }, // -y
      { pts: [1, 3, 7, 5], shade: 0.92 }, // +z
      { pts: [0, 4, 6, 2], shade: 0.46 }, // -z
    ];

    const drawCube = (center: V, size: number, ay: number, ax: number, cx: number, cy: number) => {
      const corners: { x: number; y: number; s: number }[] = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
        let v: V = { x: sx * size, y: sy * size, z: sz * size };
        v = ROT_X(ROT_Y(v, ay), ax);
        corners.push(project({ x: center.x + v.x, y: center.y + v.y, z: center.z + v.z }, cx, cy));
      }
      const avgS = (pts: number[]) => (corners[pts[0]].s + corners[pts[1]].s + corners[pts[2]].s + corners[pts[3]].s) / 4;
      const faces = [...FACES].sort((a, b) => avgS(a.pts) - avgS(b.pts)); // far faces first
      for (const f of faces) {
        const [a, b, c, d] = f.pts.map((i) => corners[i]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
        const k = f.shade;
        // gold faces with dark-gold edges so they read on the light lavender page
        const r = Math.round(232 * k + 12), g = Math.round(176 * k + 8), bl = Math.round(72 * k + 4);
        ctx.fillStyle = `rgba(${r},${g},${bl},1)`;
        ctx.fill();
        ctx.strokeStyle = "rgba(72,50,10,0.34)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    let spEased = 0;
    const draw = (t: number) => {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const spTarget = Math.min(1, Math.max(0, (window.scrollY || 0) / max));
      spEased += (spTarget - spEased) * (reduce ? 1 : 0.1); // glide toward scroll, no jitter
      const sp = spEased; // 0..1 eased scroll progress
      ctx.clearRect(0, 0, w, h);

      // soft warm core glow behind the cluster
      const cx = w * 0.66, cy = h * 0.48 - sp * h * 0.18; // parallax: drifts up, slower than scroll
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.5);
      glow.addColorStop(0, "rgba(236,184,76,0.10)");
      glow.addColorStop(1, "rgba(236,184,76,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const ay = t * 0.00010 + sp * Math.PI * 1.6;             // rotate with time + scroll
      const ax = 0.52 + Math.sin(t * 0.00018) * 0.05 + sp * 0.6;
      const scale = (Math.min(w, h) / 950) * (1 - sp * 0.12);

      const items = CELLS.map((c, idx) => {
        let p: V = { x: c.x * GAP, y: c.y * GAP, z: c.z * GAP };
        p = { x: p.x, y: p.y + Math.sin(t * 0.0008 + idx) * 9, z: p.z };
        p = ROT_X(ROT_Y(p, ay), ax);
        return { p, idx };
      }).sort((a, b) => b.p.z - a.p.z); // far cubes first

      for (const it of items) drawCube(it.p, CUBE * scale, ay, ax, cx, cy);

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    if (reduce) draw(0); else raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
