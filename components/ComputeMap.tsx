"use client";

import { useMemo, useState } from "react";
import { PROVIDERS, hourlyRate } from "@/lib/catalog";
import { regionPriceFactor } from "@/lib/routing";
import { num, usd } from "@/lib/format";

export interface MapNode {
  id: string;
  name: string;
  city: string;
  country: string;
  x: number;
  y: number;
  electricityCents: number;
  carbon: number;
  renewablePct: number;
  latencyMs: number;
  availability: number;
  pue: number;
  cost: number;
  gpuHours: number;
  co2: number;
  energy: number;
}

type MetricId = "cost" | "electricity" | "carbon" | "renewable" | "availability" | "latency";

const METRICS: { id: MetricId; label: string; good: "low" | "high"; get: (n: MapNode) => number; fmt: (v: number) => string }[] = [
  { id: "cost", label: "Workload Cost", good: "low", get: (n) => n.cost, fmt: (v) => usd(v, { compact: true }) },
  { id: "electricity", label: "Electricity", good: "low", get: (n) => n.electricityCents, fmt: (v) => `${v.toFixed(1)}¢` },
  { id: "carbon", label: "Carbon Intensity", good: "low", get: (n) => n.carbon, fmt: (v) => `${Math.round(v)}g` },
  { id: "renewable", label: "Renewable %", good: "high", get: (n) => n.renewablePct, fmt: (v) => `${Math.round(v)}%` },
  { id: "availability", label: "GPU Availability", good: "high", get: (n) => n.availability, fmt: (v) => `${Math.round(v * 100)}%` },
  { id: "latency", label: "Latency", good: "low", get: (n) => n.latencyMs, fmt: (v) => `${Math.round(v)}ms` },
];

const ARCS: [string, string][] = [
  ["us-east-1", "us-west-2"],
  ["us-east-1", "eu-west-1"],
  ["us-east-1", "ap-northeast-1"],
  ["us-east-1", "sa-east-1"],
  ["us-central-tx", "us-east-1"],
  ["eu-west-1", "eu-central-1"],
  ["eu-central-1", "ap-south-1"],
  ["ap-south-1", "ap-southeast-1"],
  ["ap-southeast-1", "ap-northeast-1"],
];

const W = 1000;
const H = 500;

function hexToRgb(h: string) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
// 0 = best (green), 1 = worst (rose), through amber.
function scale(t: number) {
  return t < 0.5 ? mix("#3fe39a", "#e8a33c", t * 2) : mix("#e8a33c", "#ff5d5d", (t - 0.5) * 2);
}

export function ComputeMap({ nodes }: { nodes: MapNode[] }) {
  const [metricId, setMetricId] = useState<MetricId>("cost");
  const [selected, setSelected] = useState<string>(() => [...nodes].sort((a, b) => b.cost - a.cost)[0]?.id ?? nodes[0]?.id);
  const [hover, setHover] = useState<string | null>(null);

  const metric = METRICS.find((m) => m.id === metricId)!;
  const values = nodes.map(metric.get);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const norm = (v: number) => {
    const t = max === min ? 0.5 : (v - min) / (max - min);
    return metric.good === "low" ? t : 1 - t;
  };

  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const sel = byId[selected];
  const px = (n: MapNode) => n.x * W;
  const py = (n: MapNode) => n.y * H;

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
      {/* Metric selector */}
      <div className="flex flex-wrap items-center gap-2">
        {METRICS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMetricId(m.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              m.id === metricId ? "border-brand/40 bg-brand/10 text-brand" : "border-line text-ink-muted hover:border-line-bright hover:text-ink"
            }`}
          >
            {m.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-ink-faint">
          Shading by <span className="text-ink-muted">{metric.label}</span> · green = optimal
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Map */}
        <div className="card relative overflow-hidden xl:col-span-2">
          <div className="relative aspect-[2/1] w-full">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
              {/* graticule */}
              {Array.from({ length: 13 }, (_, i) => (i + 1) * (W / 14)).map((x, i) => (
                <line key={`v${i}`} x1={x} x2={x} y1={0} y2={H} stroke="#ffffff" strokeOpacity="0.04" />
              ))}
              {Array.from({ length: 6 }, (_, i) => (i + 1) * (H / 7)).map((y, i) => (
                <line key={`h${i}`} x1={0} x2={W} y1={y} y2={y} stroke="#ffffff" strokeOpacity={i === 2 ? 0.09 : 0.04} />
              ))}
              {/* dot matrix */}
              {Array.from({ length: 28 }).map((_, c) =>
                Array.from({ length: 14 }).map((__, r) => (
                  <circle key={`d${c}-${r}`} cx={(c + 0.5) * (W / 28)} cy={(r + 0.5) * (H / 14)} r="1" fill="#ffffff" fillOpacity="0.05" />
                ))
              )}

              {/* connection arcs */}
              {ARCS.map(([a, b], i) => {
                const na = byId[a];
                const nb = byId[b];
                if (!na || !nb) return null;
                const ax = px(na), ay = py(na), bx = px(nb), by = py(nb);
                const mx = (ax + bx) / 2;
                const my = (ay + by) / 2 - Math.hypot(bx - ax, by - ay) * 0.22;
                return (
                  <path
                    key={i}
                    d={`M${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`}
                    fill="none"
                    stroke="#ecb84c"
                    strokeOpacity="0.16"
                    strokeWidth="1"
                    strokeDasharray="3 7"
                    className="animate-dash"
                  />
                );
              })}

              {/* nodes */}
              {nodes.map((n) => {
                const t = norm(metric.get(n));
                const color = scale(t);
                const radius = 5 + (1 - t) * 9 + (metricId === "cost" ? (n.cost / max) * 4 : 0);
                const isSel = n.id === selected;
                const isHover = n.id === hover;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${px(n)} ${py(n)})`}
                    onMouseEnter={() => setHover(n.id)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setSelected(n.id)}
                    className="cursor-pointer"
                  >
                    <circle r={radius + 8} fill={color} opacity={isSel ? 0.16 : 0.08} />
                    <circle r={radius} fill={color} opacity="0.22" className="animate-pulseNode" style={{ transformOrigin: "center" }} />
                    <circle r={isSel || isHover ? 4.5 : 3.5} fill={color} stroke="#0f0c0a" strokeWidth="1.5" />
                    {isSel && <circle r={radius + 13} fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="1" />}
                    <text x={0} y={radius + 18} textAnchor="middle" className="fill-ink-muted" fontSize="11" style={{ paintOrder: "stroke", stroke: "#0f0c0a", strokeWidth: 3 }}>
                      {n.city}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* hover tooltip */}
            {hover && byId[hover] && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-line-bright bg-bg-raised px-3 py-2 text-xs shadow-card"
                style={{ left: `${byId[hover].x * 100}%`, top: `${byId[hover].y * 100 - 3}%` }}
              >
                <div className="font-semibold text-ink">{byId[hover].name}</div>
                <div className="tnum mt-0.5 text-ink-muted">
                  {metric.label}: <span style={{ color: scale(norm(metric.get(byId[hover]))) }}>{metric.fmt(metric.get(byId[hover]))}</span>
                </div>
              </div>
            )}

            {/* legend */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-line bg-bg/80 px-3 py-1.5 backdrop-blur">
              <span className="text-[10px] text-ink-faint">{metric.good === "low" ? "Optimal" : "Best"}</span>
              <div className="h-2 w-24 rounded-full" style={{ background: "linear-gradient(90deg,#3fe39a,#e8a33c,#ff5d5d)" }} />
              <span className="text-[10px] text-ink-faint">Costly</span>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {sel && <RegionDetail node={sel} />}
      </div>

      {/* Region table */}
      <div className="card card-pad">
        <h3 className="mb-3 text-sm font-semibold tracking-tight text-ink">All regions · ranked by {metric.label.toLowerCase()}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-ink-faint">
                <th className="py-2 pr-4 font-medium">Region</th>
                <th className="py-2 pr-4 font-medium">Spend 30d</th>
                <th className="py-2 pr-4 font-medium">Electricity</th>
                <th className="py-2 pr-4 font-medium">Carbon</th>
                <th className="py-2 pr-4 font-medium">Renewable</th>
                <th className="py-2 pr-4 font-medium">Avail.</th>
                <th className="py-2 font-medium">Latency</th>
              </tr>
            </thead>
            <tbody>
              {[...nodes]
                .sort((a, b) => norm(metric.get(a)) - norm(metric.get(b)))
                .map((n) => (
                  <tr
                    key={n.id}
                    onClick={() => setSelected(n.id)}
                    className={`cursor-pointer border-b border-line/50 transition-colors hover:bg-bg-hover ${n.id === selected ? "bg-bg-hover" : ""}`}
                  >
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-sm" style={{ background: scale(norm(metric.get(n))) }} />
                        <span className="text-ink">{n.city}</span>
                        <span className="text-ink-faint">{n.country}</span>
                      </div>
                    </td>
                    <td className="tnum py-2 pr-4 text-ink-muted">{usd(n.cost, { compact: true })}</td>
                    <td className="tnum py-2 pr-4 text-ink-muted">{n.electricityCents.toFixed(1)}¢</td>
                    <td className="tnum py-2 pr-4 text-ink-muted">{n.carbon}g</td>
                    <td className="tnum py-2 pr-4 text-ink-muted">{n.renewablePct}%</td>
                    <td className="tnum py-2 pr-4 text-ink-muted">{Math.round(n.availability * 100)}%</td>
                    <td className="tnum py-2 text-ink-muted">{n.latencyMs}ms</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RegionDetail({ node }: { node: MapNode }) {
  // Cheapest H100 on-demand rate available in this region right now.
  const providersHere = PROVIDERS.filter((p) => p.regionIds.includes(node.id));
  const h100Here = providersHere.filter((p) => p.gpuIds.includes("h100"));
  const cheapest = h100Here
    .map((p) => ({ p, rate: hourlyRate("h100", p.id) * regionPriceFactor(node.electricityCents) }))
    .sort((a, b) => a.rate - b.rate)[0];

  const stats: { label: string; value: string; accent?: string }[] = [
    { label: "Spend (30d)", value: usd(node.cost, { compact: true }) },
    { label: "GPU-hours", value: num(node.gpuHours) },
    { label: "Electricity", value: `${node.electricityCents.toFixed(1)}¢/kWh` },
    { label: "Carbon", value: `${node.carbon} g/kWh`, accent: node.carbon < 150 ? "#3fe39a" : node.carbon > 450 ? "#ff5d5d" : undefined },
    { label: "Renewable", value: `${node.renewablePct}%`, accent: node.renewablePct > 70 ? "#3fe39a" : undefined },
    { label: "PUE", value: node.pue.toFixed(2) },
    { label: "Availability", value: `${Math.round(node.availability * 100)}%`, accent: node.availability > 0.6 ? "#3fe39a" : "#e8a33c" },
    { label: "Latency", value: `${node.latencyMs} ms` },
  ];

  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between">
        <div>
          <div className="stat-label">Selected region</div>
          <h3 className="mt-1 text-base font-semibold tracking-tight text-ink">{node.name}</h3>
          <p className="text-xs text-ink-faint">
            {node.city}, {node.country}
          </p>
        </div>
        <span className="pill">{providersHere.length} providers</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-y-3">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="tnum mt-0.5 text-sm font-medium" style={{ color: s.accent ?? "#ece4d8" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {cheapest && (
        <div className="mt-4 rounded-lg border border-brass/25 bg-brass/[0.06] p-3">
          <div className="stat-label text-brass">Cheapest H100 here</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="tnum text-lg font-semibold text-ink">{usd(cheapest.rate, { cents: true })}</span>
            <span className="text-xs text-ink-muted">/GPU-hr · {cheapest.p.short}</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="stat-label mb-2">Providers in region</div>
        <div className="flex flex-wrap gap-1.5">
          {providersHere.map((p) => (
            <span key={p.id} className="pill" style={{ borderColor: (p.accent ?? "#ecb84c") + "44" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.accent }} />
              {p.short}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
