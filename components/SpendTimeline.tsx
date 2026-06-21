"use client";

import { useMemo, useState } from "react";
import { AreaChart } from "./charts";
import { signedPct, usd } from "@/lib/format";

type Gran = "daily" | "weekly" | "monthly" | "forecast";
const TABS: { id: Gran; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "forecast", label: "Forecast" },
];

type Day = { day: string; cost: number };
type Fc = { day: string; value: number; lo: number; hi: number };

function label(iso: string, mode: "day" | "month") {
  const d = new Date(iso + "T00:00:00Z");
  return mode === "month"
    ? d.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function build(gran: Gran, daily: Day[], forecast: Fc[]) {
  if (gran === "weekly") {
    const out: { label: string; value: number }[] = [];
    for (let i = 0; i < daily.length; i += 7) {
      const chunk = daily.slice(i, i + 7);
      out.push({ label: label(chunk[chunk.length - 1].day, "day"), value: chunk.reduce((s, d) => s + d.cost, 0) });
    }
    return { data: out, color: "#ecb84c", note: `${out.length} weeks · ${usd(daily.reduce((s, d) => s + d.cost, 0))} total` };
  }
  if (gran === "monthly") {
    const m = new Map<string, number>();
    for (const d of daily) {
      const key = d.day.slice(0, 7);
      m.set(key, (m.get(key) ?? 0) + d.cost);
    }
    const data = [...m.entries()].map(([k, v]) => ({ label: label(k + "-01", "month"), value: v }));
    return { data, color: "#ecb84c", note: `${data.length} months tracked` };
  }
  if (gran === "forecast") {
    const recent = daily.slice(-21).map((d) => ({ label: label(d.day, "day"), value: d.cost }));
    const proj = forecast.map((f) => ({ label: label(f.day, "day"), value: f.value }));
    const projTotal = forecast.reduce((s, f) => s + f.value, 0);
    return { data: [...recent, ...proj], color: "#ffd97a", note: `${usd(projTotal)} projected · next ${forecast.length} days`, forecastFrom: recent.length };
  }
  const data = daily.slice(-30).map((d) => ({ label: label(d.day, "day"), value: d.cost }));
  return { data, color: "#ecb84c", note: `Last 30 days · ${usd(data.reduce((s, d) => s + d.value, 0))}` };
}

export function SpendTimeline({ daily, forecast }: { daily: Day[]; forecast: Fc[] }) {
  const [gran, setGran] = useState<Gran>("daily");
  const s = useMemo(() => build(gran, daily, forecast), [gran, daily, forecast]);

  const total = s.data.reduce((a, b) => a + b.value, 0);
  const half = Math.floor(s.data.length / 2) || 1;
  const firstHalf = s.data.slice(0, half).reduce((a, b) => a + b.value, 0) || 1;
  const secondHalf = s.data.slice(half).reduce((a, b) => a + b.value, 0);
  const momentum = ((secondHalf - firstHalf) / firstHalf) * 100;

  return (
    <div className="card card-pad">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">Spending timeline</h3>
          <p className="mt-0.5 text-xs text-ink-faint">{s.note}</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-bg-raised p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setGran(t.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                gran === t.id ? "bg-bg-hover text-ink shadow-card" : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-end gap-4">
        <div>
          <div className="stat-label">{gran === "forecast" ? "Projected total" : "Period total"}</div>
          <div className="tnum text-2xl font-semibold text-ink">{usd(total)}</div>
        </div>
        {gran !== "forecast" && (
          <div className="mb-1 text-xs">
            <span className={`tnum font-medium ${momentum >= 0 ? "text-rose" : "text-leaf"}`}>{signedPct(momentum)}</span>{" "}
            <span className="text-ink-faint">period-over-period</span>
          </div>
        )}
        {gran === "forecast" && <div className="mb-1 text-xs text-brass">trend-fitted · 95% band on /budget</div>}
      </div>

      <AreaChart data={s.data} unit="usd" color={s.color} height={248} />
    </div>
  );
}
