"use client";

import { useState } from "react";
import { AreaChart } from "./charts";
import { shortDate, usd, co2 as fmtCo2 } from "@/lib/format";

type Point = { day: string; cost: number; co2: number };

export function SpendTrendCard({ trend }: { trend: Point[] }) {
  const [view, setView] = useState<"cost" | "carbon">("cost");
  const isCost = view === "cost";

  const data = trend.map((t) => ({ label: shortDate(t.day), value: isCost ? t.cost : t.co2 }));
  const total = trend.reduce((a, b) => a + (isCost ? b.cost : b.co2), 0);
  const peak = Math.max(...trend.map((t) => (isCost ? t.cost : t.co2)));

  return (
    <div className="card card-pad">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            {isCost ? "Spend" : "Carbon"} over time
          </h3>
          <p className="mt-0.5 text-xs text-ink-faint">Daily, trailing 60 days · all providers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="tnum text-sm font-semibold text-ink">{isCost ? usd(total) : fmtCo2(total)}</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-faint">
              total · peak {isCost ? usd(peak, { compact: true }) : fmtCo2(peak)}
            </div>
          </div>
          <div className="flex rounded-lg border border-line p-0.5 text-xs">
            <button
              onClick={() => setView("cost")}
              className={`rounded-md px-2.5 py-1 transition-colors ${isCost ? "bg-bg-hover text-ink" : "text-ink-muted hover:text-ink"}`}
            >
              Spend
            </button>
            <button
              onClick={() => setView("carbon")}
              className={`rounded-md px-2.5 py-1 transition-colors ${!isCost ? "bg-bg-hover text-ink" : "text-ink-muted hover:text-ink"}`}
            >
              Carbon
            </button>
          </div>
        </div>
      </div>
      <AreaChart data={data} unit={isCost ? "usd" : "kg"} color={isCost ? "#ecb84c" : "#3fe39a"} height={236} />
    </div>
  );
}
