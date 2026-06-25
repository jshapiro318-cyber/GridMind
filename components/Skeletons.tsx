// Skeleton loaders for the app's data-backed views. Pure CSS shimmer (no client
// JS), so they stream instantly inside the shell — a slow or cold load reads as
// "content arriving" rather than a black screen. See `.skeleton` in globals.css.
import type { ReactNode } from "react";

/** A single shimmering block. Size + radius come from utility classes. */
function Sk({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** Card chrome matching the app's `.card`, for skeletons to live inside. */
function SkCard({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-xl border border-line bg-bg-card p-5 ${className}`}>{children}</div>;
}

/** A KPI / stat tile (label · value · delta). */
function SkStat() {
  return (
    <SkCard>
      <Sk className="h-3 w-24 rounded" />
      <Sk className="mt-3 h-7 w-28 rounded-md" />
      <Sk className="mt-3 h-3 w-20 rounded" />
    </SkCard>
  );
}

/** A vertical list of rows (icon · label · value) — provider/team breakdowns. */
function SkList({ rows = 5, icon = true }: { rows?: number; icon?: boolean }) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {icon && <Sk className="h-8 w-8 shrink-0 rounded-lg" />}
          <Sk className="h-3 flex-1 rounded" />
          <Sk className="h-3 w-12 shrink-0 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Generic app-page skeleton: a stat row, a wide panel, and two side panels.
 * Used as the default loading.tsx for every (app) route, so no view ever flashes
 * a blank dark screen while its server data streams in.
 */
export function PageSkeleton() {
  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5" role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkStat key={i} />
        ))}
      </div>
      <SkCard>
        <Sk className="h-3.5 w-40 rounded" />
        <Sk className="mt-5 h-[240px] w-full rounded-lg" />
      </SkCard>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SkCard>
          <Sk className="h-3.5 w-32 rounded" />
          <SkList rows={5} />
        </SkCard>
        <SkCard>
          <Sk className="h-3.5 w-28 rounded" />
          <SkList rows={5} />
        </SkCard>
      </div>
    </div>
  );
}

/**
 * Dashboard-specific skeleton: KPI row, primary chart beside a GridScore gauge,
 * then two breakdown panels — mirrors /dashboard so the swap to real content
 * doesn't shift the layout. It's also the view a new customer lands on right
 * after sign-in, so it's the most important one not to show as a black screen.
 */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5" role="status" aria-label="Loading dashboard">
      <span className="sr-only">Loading your dashboard…</span>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkStat key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <SkCard>
          <div className="flex items-center justify-between">
            <Sk className="h-3.5 w-44 rounded" />
            <Sk className="h-6 w-28 rounded-md" />
          </div>
          <Sk className="mt-5 h-[260px] w-full rounded-lg" />
        </SkCard>
        <SkCard className="flex flex-col items-center justify-center gap-4 py-8">
          <Sk className="h-32 w-32 rounded-full" />
          <Sk className="h-3 w-32 rounded" />
          <Sk className="h-3 w-24 rounded" />
        </SkCard>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SkCard>
          <Sk className="h-3.5 w-36 rounded" />
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Sk className="h-3 w-24 shrink-0 rounded" />
                <Sk className="h-2 flex-1 rounded-full" />
                <Sk className="h-3 w-12 shrink-0 rounded" />
              </div>
            ))}
          </div>
        </SkCard>
        <SkCard>
          <Sk className="h-3.5 w-40 rounded" />
          <SkList rows={6} />
        </SkCard>
      </div>
    </div>
  );
}
