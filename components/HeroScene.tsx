"use client";

import { useEffect, useRef } from "react";
import { PROVIDERS, REGIONS, project } from "@/lib/catalog";
import { scorePlacement } from "@/lib/gridscore";

export interface HeroNode {
  id: string;
  name: string;
  carbon: number;
  electricity: number;
  renewable: number;
  score: number;
  x: number;
  y: number;
}

// Best achievable GridScore per region (max over the providers operating there).
const REGION_INFO: Record<string, Omit<HeroNode, "x" | "y">> = Object.fromEntries(
  REGIONS.map((r) => {
    const provs = PROVIDERS.filter((p) => p.regionIds.includes(r.id));
    const score = provs.length ? Math.max(...provs.map((p) => scorePlacement(p.id, r.id).score)) : 0;
    return [r.id, { id: r.id, name: r.name, carbon: r.carbon, electricity: r.electricityCents, renewable: r.renewablePct, score }];
  })
);

// Curated routing lanes between major hubs — what GridMind is doing, made visible.
const ARCS: [string, string][] = [
  ["us-east-1", "us-west-2"],
  ["us-east-1", "us-central-tx"],
  ["us-east-1", "ca-central"],
  ["eu-west-1", "eu-north-1"],
  ["eu-central-1", "eu-north-1"],
  ["us-east-1", "eu-north-1"],
  ["ap-southeast-1", "ap-south-1"],
  ["ap-northeast-1", "us-west-2"],
  ["sa-east-1", "us-east-1"],
  ["me-central-1", "eu-central-1"],
];

function nodeColor(carbon: number): string {
  if (carbon < 120) return "242,207,110"; // clean — bright gold
  if (carbon < 400) return "236,184,76"; // mid — gold
  return "176,165,148"; // dirty — washed-out
}

interface Pt {
  x: number;
  y: number;
  bx: number;
  by: number;
  carbon: number;
}

const CURSOR_R = 230; // px radius of cursor influence

/**
 * Living, interactive global compute network: nodes pulse on a world projection
 * while workloads stream along routing lanes — and the whole field reacts to the
 * cursor (attraction, constellation links, a light aura).
 */
export function HeroScene({ className = "", onNode }: { className?: string; onNode?: (n: HeroNode | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const onNodeRef = useRef(onNode);
  onNodeRef.current = onNode;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;

    const nodes: Record<string, Pt> = {};
    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mapW = w;
      const mapH = w / 2;
      const oy = h / 2 - mapH / 2 - h * 0.04;
      for (const r of REGIONS) {
        const p = project(r.lat, r.lon);
        const x = p.x * mapW;
        const y = oy + p.y * mapH;
        const cur = nodes[r.id];
        nodes[r.id] = { x: cur?.x ?? x, y: cur?.y ?? y, bx: x, by: y, carbon: r.carbon };
      }
    };
    layout();

    // cursor state (canvas-local, eased)
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: false };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - rect.left;
      mouse.ty = e.clientY - rect.top;
      mouse.on = mouse.ty > -40 && mouse.ty < h + 40;
    };
    const onLeave = () => {
      mouse.on = false;
      mouse.tx = -9999;
      mouse.ty = -9999;
    };

    const arcs = ARCS.map(([a, b], i) => ({ a, b, phase: (i / ARCS.length) * Math.PI * 2, speed: 0.00021 + (i % 4) * 0.00004 }));

    const ctrl = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * 0.28 });
    const bez = (a: Pt, c: { x: number; y: number }, b: Pt, t: number) => {
      const u = 1 - t;
      return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
    };

    let raf = 0;
    let hoveredId: string | null = null;
    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      // ease cursor
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      const near = (n: Pt) => Math.hypot(n.x - mouse.x, n.y - mouse.y);

      // node attraction toward cursor (eased back to base otherwise)
      for (const r of REGIONS) {
        const n = nodes[r.id];
        if (!n) continue;
        let tx = n.bx;
        let ty = n.by;
        if (mouse.on) {
          const d = Math.hypot(n.bx - mouse.x, n.by - mouse.y);
          if (d < CURSOR_R) {
            const pull = (1 - d / CURSOR_R) * 18;
            tx = n.bx + ((mouse.x - n.bx) / (d || 1)) * pull;
            ty = n.by + ((mouse.y - n.by) / (d || 1)) * pull;
          }
        }
        n.x += (tx - n.x) * 0.08;
        n.y += (ty - n.y) * 0.08;
      }

      // hover hit-test — nearest node within reach of the cursor
      let hit: string | null = null;
      if (mouse.on) {
        let bestD = 30;
        for (const r of REGIONS) {
          const n = nodes[r.id];
          if (!n) continue;
          const d = near(n);
          if (d < bestD) {
            bestD = d;
            hit = r.id;
          }
        }
      }
      if (hit !== hoveredId) {
        hoveredId = hit;
        if (onNodeRef.current) {
          if (hit && nodes[hit]) {
            const rect = canvas.getBoundingClientRect();
            const n = nodes[hit];
            onNodeRef.current({ ...REGION_INFO[hit], x: rect.left + n.x, y: rect.top + n.y });
          } else {
            onNodeRef.current(null);
          }
        }
      }

      // cursor aura
      if (mouse.on) {
        const ag = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, CURSOR_R);
        ag.addColorStop(0, "rgba(236,184,76,0.07)");
        ag.addColorStop(1, "rgba(236,184,76,0)");
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, CURSOR_R, 0, Math.PI * 2);
        ctx.fill();
      }

      // routing lanes + travelling workloads
      for (const arc of arcs) {
        const a = nodes[arc.a];
        const b = nodes[arc.b];
        if (!a || !b) continue;
        const c = ctrl(a, b);
        const boost = mouse.on ? Math.max(0, 1 - Math.min(near(a), near(b)) / CURSOR_R) : 0;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
        ctx.strokeStyle = `rgba(236,184,76,${0.12 + boost * 0.3})`;
        ctx.lineWidth = 1 + boost;
        ctx.stroke();

        const tt = reduced ? 0.5 : (time * (arc.speed * (1 + boost)) + arc.phase / (Math.PI * 2)) % 1;
        const col = nodeColor(b.carbon);
        for (let k = 0; k < 6; k++) {
          const tk = tt - k * 0.018;
          if (tk < 0) continue;
          const p = bez(a, c, b, tk);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.7 - k * 0.18, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${col},${0.9 - k * 0.15})`;
          ctx.fill();
        }
        const head = bez(a, c, b, tt);
        const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 9);
        g.addColorStop(0, `rgba(${col},${0.5 + boost * 0.35})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 9 + boost * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // constellation links from cursor to nearby nodes
      if (mouse.on) {
        for (const r of REGIONS) {
          const n = nodes[r.id];
          if (!n) continue;
          const d = near(n);
          if (d < CURSOR_R) {
            const a = (1 - d / CURSOR_R) * 0.5;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.strokeStyle = `rgba(${nodeColor(n.carbon)},${a})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // region nodes (brighten near cursor)
      for (const r of REGIONS) {
        const n = nodes[r.id];
        if (!n) continue;
        const col = nodeColor(n.carbon);
        const pulse = reduced ? 0.6 : 0.5 + 0.5 * Math.sin(time * 0.0014 + n.bx * 0.04);
        const boost = mouse.on ? Math.max(0, 1 - near(n) / CURSOR_R) : 0;
        const gr = 22 + boost * 18;
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, gr);
        glow.addColorStop(0, `rgba(${col},${0.18 + pulse * 0.18 + boost * 0.3})`);
        glow.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, gr, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.3 + boost * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},0.98)`;
        ctx.fill();
        // selection ring on the hovered node
        if (r.id === hoveredId) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 9, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${col},0.9)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", layout);
    if (!reduced) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseleave", onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", layout);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
